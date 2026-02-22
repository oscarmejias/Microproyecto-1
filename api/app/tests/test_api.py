import json

import pandas as pd
from fastapi.testclient import TestClient


def _valid_predict_payload() -> dict:
    return {
       "inputs": [
                    {
                        "student_info": {
                            "student_id": "ST-2024-001",
                            "name": "John Doe"
                        },
                        "academic_context": {
                            "semester": 4,
                            "batch_id": "2026-01-MAIA",
                            "course": "Computer Science"
                        },
                        "features": {
                            "age_at_enrollment": 19,
                            "gender": 1,
                            "displaced": 0,
                            "debtor": 0,
                            "tuition_fees_up_to_date": 1,
                            "scholarship_holder": 1,
                            "curricular_units_1st_sem_enrolled": 6,
                            "curricular_units_1st_sem_approved": 6,
                            "curricular_units_1st_sem_grade": 14.5,
                            "curricular_units_2nd_sem_enrolled": 6,
                            "curricular_units_2nd_sem_approved": 6,
                            "curricular_units_2nd_sem_grade": 15.0,
                        }
                    }
                ]
    }


def _valid_csv_content() -> str:
    return (
        "name, student_id, semester, batch_id, course, age_at_enrollment,gender,displaced,debtor,tuition_fees_up_to_date,scholarship_holder,"
        "curricular_units_1st_sem_enrolled,curricular_units_1st_sem_approved,curricular_units_1st_sem_grade,"
        "curricular_units_2nd_sem_enrolled,curricular_units_2nd_sem_approved,curricular_units_2nd_sem_grade\n"
        "John Doe, ST-2024-001, 4, 2026-01-MAIA, Computer Science, 19, 1, 0, 0, 1, 1, 6, 6, 14.5, 6, 6, 15.0\n"
    )


def test_predict_success_returns_prediction_results(
    client: TestClient, monkeypatch
) -> None:
    def fake_make_prediction(input_data: pd.DataFrame) -> dict:
        assert isinstance(input_data, pd.DataFrame)
        return {"errors": None, "version": "test-version", "predictions": [0.2]}

    monkeypatch.setattr("app.api.make_prediction", fake_make_prediction)

    response = client.post("/api/v1/predict", json=_valid_predict_payload())
    assert response.status_code == 200, response.text
    body = response.json()
    print(body)
    print(body)
    assert body["errors"] is None
    assert body["version"] == "test-version"
    assert body["predictions"] == [0.2]
    assert body["metadata"]["model_version"] == "test-version"
    assert body["metadata"]["api_version"] == "0.0.1"
    assert "T" in body["metadata"]["timestamp"]
    assert body["metadata"]["timestamp"].endswith("Z")
    assert len(body["prediction"]) == 1
    detail = body["prediction"][0]
    assert detail["student_id"] == "ST-2024-001"
    assert detail["categoria"] == "Bajo Riesgo"
    assert detail["risk_level"] == "Bajo"
    assert detail["outcome"] == "Graduate"
    assert detail["risk_score"] == 0.2
    assert detail["class_probabilities"] == {"Graduate": 0.8, "Dropout": 0.2}
    assert "recommendation" in detail
    assert "intervention_steps" in detail
    assert "nivel_riesgo" not in detail
    assert "recomendacion" not in detail
    assert "pasos_intervencion" not in detail


def test_predict_returns_422_for_invalid_payload(client: TestClient) -> None:
    invalid_payload = {"inputs": [{"age_at_enrollment": 19}]}

    response = client.post("/api/v1/predict", json=invalid_payload)

    assert response.status_code == 422


def test_predict_returns_400_when_model_validation_fails(
    client: TestClient, monkeypatch
) -> None:
    def fake_prepare_model_input(_: pd.DataFrame) -> pd.DataFrame:
        return pd.DataFrame([{"debtor": 1}])

    def fake_make_prediction(input_data: pd.DataFrame) -> dict:
        assert isinstance(input_data, pd.DataFrame)
        return {
            "errors": json.dumps({"features": ["invalid format"]}),
            "version": "test-version",
            "predictions": None,
        }

    monkeypatch.setattr("app.api.prepare_model_input", fake_prepare_model_input)
    monkeypatch.setattr("app.api.make_prediction", fake_make_prediction)

    response = client.post("/api/v1/predict", json=_valid_predict_payload())

    assert response.status_code == 400, response.text
    assert response.json()["detail"] == {"features": ["invalid format"]}


def test_predict_csv_success_returns_prediction_results(
    client: TestClient, monkeypatch
) -> None:
    def fake_make_prediction(input_data: pd.DataFrame) -> dict:
        assert isinstance(input_data, pd.DataFrame)
        return {"errors": None, "version": "csv-test-version", "predictions": [0.2]}

    monkeypatch.setattr("app.api.make_prediction", fake_make_prediction)

    response = client.post(
        "/api/v1/predict/csv",
        files={"file": ("students.csv", _valid_csv_content(), "text/csv")},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    print(body)
    assert body["errors"] is None
    assert body["version"] == "csv-test-version"
    assert body["predictions"] == [0.2]
    assert body["metadata"]["model_version"] == "csv-test-version"
    assert body["metadata"]["api_version"] == "0.0.1"
    assert "T" in body["metadata"]["timestamp"]
    assert body["metadata"]["timestamp"].endswith("Z")
    assert len(body["prediction"]) == 1
    detail = body["prediction"][0]
    assert detail["student_id"] == "ST-2024-001"
    assert detail["risk_level"] == "Bajo"
    assert detail["outcome"] == "Graduate"
    assert detail["risk_score"] == 0.2
    assert detail["class_probabilities"] == {"Graduate": 0.8, "Dropout": 0.2}
    assert "recommendation" in detail
    assert "intervention_steps" in detail
    assert "nivel_riesgo" not in detail
    assert "recomendacion" not in detail
    assert "pasos_intervencion" not in detail


def test_predict_csv_rejects_non_csv_extension(client: TestClient) -> None:
    response = client.post(
        "/api/v1/predict/csv",
        files={"file": ("students.txt", "a,b\n1,2\n", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "File must be a CSV file"


def test_predict_csv_returns_400_for_empty_csv(client: TestClient) -> None:
    header_only = (
        "age_at_enrollment,gender,displaced,debtor,tuition_fees_up_to_date,scholarship_holder,"
        "curricular_units_1st_sem_enrolled,curricular_units_1st_sem_approved,curricular_units_1st_sem_grade,"
        "curricular_units_2nd_sem_enrolled,curricular_units_2nd_sem_approved,curricular_units_2nd_sem_grade\n"
    )
    response = client.post(
        "/api/v1/predict/csv",
        files={"file": ("students.csv", header_only, "text/csv")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "CSV file is empty"


def test_predict_csv_returns_422_for_invalid_schema(client: TestClient) -> None:
    invalid_csv = "student_id,name\n1,John Doe\n"
    response = client.post(
        "/api/v1/predict/csv",
        files={"file": ("students.csv", invalid_csv, "text/csv")},
    )

    assert response.status_code == 422
