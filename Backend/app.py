import os
import json
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from docx import Document
from dotenv import load_dotenv

# --- Configuration ---
# Load environment variables from .env file
load_dotenv()

# --- Gemini API Configuration ---
# The API key is now loaded from your .env file.
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env file or environment variables.")
    genai.configure(api_key=api_key)
    GEMINI_MODEL = genai.GenerativeModel('gemini-2.5-flash')
except (ValueError, KeyError) as e:
    print(f"FATAL: {e}")
    GEMINI_MODEL = None
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    GEMINI_MODEL = None

# --- Google Sheets API Configuration ---
SHEET_SCOPE = ["https://spreadsheets.google.com/feeds", 'https://www.googleapis.com/auth/drive']
SHEET_NAME = "ATSFriendlyResume_Export"

# --- Flask App Configuration ---
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# --- Helper Functions ---

def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_resume_text(filepath: str) -> str:
    """Extracts text from a .docx or .pdf file."""
    if filepath.endswith(".docx"):
        try:
            doc = Document(filepath)
            return "\n".join([para.text for para in doc.paragraphs])
        except Exception:
            return ""
    elif filepath.endswith(".pdf"):
        # This is a placeholder. You would need a library like PyMuPDF for this.
        return "PDF parsing is not fully implemented in this version."
    return ""


def create_optimization_prompt(resume_text: str, jd_text: str) -> str:
    """Generates the detailed prompt for the Gemini agent for ATS optimization."""
    return f'''
    You are an expert ATS (Applicant Tracking System) Optimization AI Agent. Your goal is to analyze the provided resume against the job description and modify the resume content to maximize its ATS score, aiming for 85 or above (out of 100).

    You MUST return the response in a single, strictly valid JSON object that adheres to the required schema. DO NOT include any explanatory text, markdown outside of the JSON block, or conversation before or after the JSON.

    ### CRITICAL INSTRUCTIONS:
    1.  **ATS Score Calculation (0-100):**
        *   40% Weight: Structural & Formatting Compliance (Standard headings, clean parsing).
        *   60% Weight: Keyword Match Rate & Relevance (How well skills and experience match the JD).
        *   Target Score: The final `ats_score` in the JSON MUST be 85+ after optimization.
    2.  **Modification Rule:** Only make necessary changes to content, wording, and keyword density. Do NOT add entirely fabricated experience. Focus on re-framing existing experience using JD keywords.
    3.  **Output Format:** Provide the full, optimized resume text as a clean string. List the changes and recommendations separately.

    ### INPUT DATA:
    <JOB_DESCRIPTION>
    {jd_text}
    </JOB_DESCRIPTION>

    <CURRENT_RESUME_TEXT>
    {resume_text}
    </CURRENT_RESUME_TEXT>

    ### TASK:
    1.  Analyze the CURRENT_RESUME_TEXT for ATS compliance and keyword match against the JOB_DESCRIPTION.
    2.  Generate the OPTIMIZED_RESUME_TEXT by standardizing headers, integrating JD keywords, and cleaning formatting.
    3.  Calculate the final `ats_score` (must be 85+).
    4.  List the exact **Modifications Made**.
    5.  List any remaining **Recommendations** for the user.

    ### REQUIRED JSON OUTPUT SCHEMA:
    {{
      "ats_score": <integer>,
      "optimized_resume_text": "<string>",
      "modifications_made": ["<string>", "<string>", ...],
      "user_recommendations": ["<string>", "<string>", ...]
    }}
    '''


def create_generation_prompt(user_prompt: str) -> str:
    """Generates the prompt for the Gemini agent to create a new resume."""
    return f'''
    You are a professional resume writer AI. Your task is to generate a complete, well-structured, and ATS-friendly resume based on the user's request.

    You MUST return the response in a single, strictly valid JSON object.

    ### USER REQUEST:
    {user_prompt}

    ### TASK:
    1.  Create a full resume based on the user's request.
    2.  The resume should include standard sections: Contact Information, Summary, Skills, Experience, Education, and Projects (if applicable).
    3.  Ensure the content is professional and uses action verbs.
    4.  The output must be a single string.

    ### REQUIRED JSON OUTPUT SCHEMA:
    {{
      "generated_resume_text": "<string>"
    }}
    '''


def get_gemini_response(prompt: str) -> dict:
    """Sends a prompt to the Gemini API and returns the parsed JSON response."""
    if not GEMINI_MODEL:
        return {"error": "Gemini API is not configured."}
    try:
        response = GEMINI_MODEL.generate_content(prompt)
        # Clean the response to extract only the JSON part
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"Error getting response from Gemini: {e}")
        return {"error": f"Failed to get a valid response from the AI model: {e}"}


# --- API Endpoints ---

@app.route('/api/analyze', methods=['POST'])
def analyze_resume_endpoint():
    if not GEMINI_MODEL:
        return jsonify({'error': 'AI model is not configured. Please check your API key.'}), 500

    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided.'}), 400

    file = request.files['resume']
    job_description = request.form.get('job_description', '')

    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid or no file selected.'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    resume_text = parse_resume_text(filepath)
    if not resume_text or "parsing is not fully implemented" in resume_text:
        return jsonify({'error': 'Could not read text from the resume file.'}), 500

    prompt = create_optimization_prompt(resume_text, job_description)
    ai_response = get_gemini_response(prompt)

    if "error" in ai_response:
        return jsonify(ai_response), 500

    # Save the optimized resume to a .docx file
    optimized_filename = f"Optimized_{filename.rsplit('.', 1)[0]}.docx"
    optimized_filepath = os.path.join(app.config['UPLOAD_FOLDER'], optimized_filename)
    doc = Document()
    doc.add_paragraph(ai_response.get("optimized_resume_text", ""))
    doc.save(optimized_filepath)

    ai_response['download_path'] = f"uploads/{optimized_filename}"

    return jsonify(ai_response)


@app.route('/api/generate-resume', methods=['POST'])
def generate_resume_endpoint():
    if not GEMINI_MODEL:
        return jsonify({'error': 'AI model is not configured. Please check your API key.'}), 500

    data = request.get_json()
    prompt_text = data.get('prompt')
    if not prompt_text:
        return jsonify({'error': 'No prompt provided.'}), 400

    prompt = create_generation_prompt(prompt_text)
    ai_response = get_gemini_response(prompt)

    if "error" in ai_response:
        return jsonify(ai_response), 500

    generated_text = ai_response.get("generated_resume_text", "")

    # Save the generated resume to a .docx file
    generated_filename = "Generated_Resume.docx"
    generated_filepath = os.path.join(app.config['UPLOAD_FOLDER'], generated_filename)
    doc = Document()
    doc.add_paragraph(generated_text)
    doc.save(generated_filepath)

    return jsonify({
        'content': generated_text,
        'download_path': f"uploads/{generated_filename}"
    })


@app.route('/api/export-to-sheets', methods=['POST'])
def export_to_sheets_endpoint():
    try:
        creds = ServiceAccountCredentials.from_json_keyfile_name('google-sheets-credentials.json', SHEET_SCOPE)
        client = gspread.authorize(creds)
        sheet = client.open(SHEET_NAME).sheet1
    except FileNotFoundError:
        return jsonify({"error": "Google Sheets credentials file not found."}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to connect to Google Sheets: {e}"}), 500

    data = request.get_json()

    # Prepare a row to insert into the sheet
    row = [
        data.get("ats_score", ""),
        ", ".join(data.get("modifications_made", [])),
        ", ".join(data.get("user_recommendations", [])),
        data.get("optimized_resume_text", "")
    ]

    try:
        sheet.append_row(row)
        return jsonify({"success": "Data exported to Google Sheet successfully."})
    except Exception as e:
        return jsonify({"error": f"Failed to write to Google Sheet: {e}"}), 500


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serves files from the upload folder for downloading."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
