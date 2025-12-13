from os import makedirs, listdir
from os.path import join, exists
from pypdf import PdfReader, PdfWriter

def strip_metadata(input_path: str, output_path: str) -> None:
    reader = PdfReader(input_path)
    writer = PdfWriter()

    # Copy all pages, but not the original metadata
    for page in reader.pages:
        writer.add_page(page)

    # Explicitly set empty metadata
    writer.add_metadata({})

    with open(output_path, "wb") as f:
        writer.write(f)

# Process all PDFs in the music_scores directory
input_folder = "music_scores"
output_folder = "music_scores_no_meta"
makedirs(output_folder, exist_ok=True)

for filename in listdir(input_folder):
    if filename.lower().endswith(".pdf"):
        input_path = join(input_folder, filename)
        output_path = join(output_folder, filename)
        
        # Skip if already processed
        if exists(output_path):
            continue
        
        strip_metadata(input_path, output_path)
