# Backend

FastAPI backend service.


pip install -r requirements.txt
uvicorn app.main:app --reload
uvicorn app.main:app --host 0.0.0.0 --port $PORT

pip install poetry
poetry install
poetry run dev --reload    