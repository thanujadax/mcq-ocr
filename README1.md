
## Installation
 ### Install Poetry
If not already installed
```bash
curl -sSL https://install.python-poetry.org | python3 -

```
### Install Dependencies 

From the project root.

```bash
poetry install
```
Dependencies used:
```bash
numpy

matplotlib

opencv-python

pillow

imutils
```

## Folder Structure

The folder Structure has been arranged as follows:

```bash
.
├── configurations/           # JSON files with experiment/run configurations
├── mcqautograder/            # Core Python package with grading logic
└── samples/                  # Sample inputs and templates for testing
    ├── answers/              # Scanned or digital MCQ answer sheets
    ├── marking_schemes/      # Corresponding marking scheme files
    └── templates/            # Templates used to align and process answer sheets
```
In the configurations folder all the version details has been given in JSON files(alignment coordinates, etc). The other folders can be populated with the data you have.

## Running the code

To run the V1 script, please run this command as follows:

```bash
!python3 mcqautograder/autograder.py --template 2023-answers-scanned/blank-templates/V1.jpg --markingscheme 2023-answers-scanned/marking-scheme/V1-MODEL_ANSWERS.jpg --answers /content/drive/MyDrive/Document_Digitization_VLM/MCQAutoGrader/2023-answers-scanned/student-answers/V1/ --studentslist /content/drive/MyDrive/Document_Digitization_VLM/MCQAutoGrader/student_listv1.csv --output output/V1_final/ --version 1 --showmarked
```

similarly for V2:

```bash
!python3 mcqautograder/autograder.py --template 2023-answers-scanned/blank-templates/V1.jpg --markingscheme 2023-answers-scanned/marking-scheme/V2-MODEL_ANSWERS.jpg --answers /content/drive/MyDrive/Document_Digitization_VLM/MCQAutoGrader/2023-answers-scanned/student-answers/V2/ --studentslist /content/drive/MyDrive/Document_Digitization_VLM/MCQAutoGrader/student_listv2.csv --output output/V2_final/ --version 1 --savemarked
``` 
make sure the csv file's format replicates as given in the repo

