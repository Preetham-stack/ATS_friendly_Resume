import docx
import fitz  # PyMuPDF


def parse_resume(file_path):
    """Extracts text from a resume file (PDF or DOCX)."""
    text = ""
    if file_path.endswith('.docx'):
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            print(f"Error reading DOCX file: {e}")
            return None
    elif file_path.endswith('.pdf'):
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            print(f"Error reading PDF file: {e}")
            return None
    else:
        return None

    return text