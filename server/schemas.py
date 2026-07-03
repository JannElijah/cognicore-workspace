from pydantic import BaseModel, Field, constr, conint, ValidationError
from typing import Optional, List, Dict, Any, Union
from functools import wraps
from flask import request, jsonify

class StartSessionRequest(BaseModel):
    username: Optional[constr(min_length=1, max_length=50)] = None
    game_type: constr(min_length=1, max_length=50)
    game_mode: Optional[constr(max_length=50)] = 'timed'

class SubmitMetricsRequest(BaseModel):
    session_id: Union[int, str]
    cognitive_domain: constr(min_length=1, max_length=100)
    game_type: constr(min_length=1, max_length=100)
    reaction_time: conint(ge=0)
    accuracy_rate: Union[float, int]
    difficulty: Union[float, int]
    error_count: conint(ge=0)
    hesitation_ms: Optional[Union[float, int]] = 0
    spam_click_count: Optional[conint(ge=0)] = 0
    is_offline_sync: Optional[bool] = False
    timestamp: Optional[str] = None

class DDARequest(BaseModel):
    session_id: Union[int, str]

class SubmitAssessmentRequest(BaseModel):
    username: Optional[constr(min_length=1, max_length=50)] = None
    domain_scores: Dict[str, Union[float, int]]
    time_taken: conint(ge=0)

class SyncOfflineTelemetryRequest(BaseModel):
    username: Optional[constr(min_length=1, max_length=50)] = None
    telemetry: List[Dict[str, Any]]

def validate_json(schema: BaseModel):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                # Validate and parse the incoming JSON
                data = request.get_json(force=True)
                validated_data = schema(**data)
                # Attach the validated Pydantic object to the request
                request.validated_data = validated_data
            except ValidationError as e:
                return jsonify({
                    "status": "error",
                    "message": "Validation Error",
                    "details": e.errors()
                }), 400
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": "Invalid JSON Payload"
                }), 400
            return f(*args, **kwargs)
        return wrapper
    return decorator
