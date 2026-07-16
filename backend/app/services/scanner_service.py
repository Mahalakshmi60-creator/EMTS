import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

load_dotenv()

class RiskFinding(BaseModel):
    line_number: int = Field(..., description="Line number where the secret was detected (1-indexed)")
    secret_type: str = Field(..., description="Type of secret found (e.g., API Key, Private Key, JWT Token, Database URI)")
    severity: str = Field(..., description="Severity of the exposure: LOW, MEDIUM, HIGH, CRITICAL")
    confidence_score: float = Field(..., description="Confidence score from 0.0 to 1.0")
    remediation: str = Field(..., description="Step-by-step remediation action to revoke and rotate the secret")

class ScanReport(BaseModel):
    findings: List[RiskFinding]
    risk_score: int = Field(..., description="Overall safety risk rating from 0 (clean) to 100 (critical leaks)")

def analyze_code_for_secrets(code_snippet: str, file_name: str) -> ScanReport:
    # Strict 500 KB limit check to defend against DoS and token exhaustion
    payload_size = len(code_snippet.encode('utf-8'))
    if payload_size > 500 * 1024:
        raise ValueError(f"Payload size ({payload_size / 1024:.2f} KB) exceeds the 500 KB safety limit.")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not configured. Please supply a valid Google Gemini API Key.")

    # Initialize the google-genai client
    client = genai.Client(api_key=api_key)

    system_instruction = (
        "You are an expert enterprise cybersecurity analyst specializing in static analysis. "
        "Review the provided code snippet for hardcoded secrets, API keys, credentials, private keys, or passwords. "
        "You must respond ONLY with valid JSON conforming to the requested schema. "
        "Do not include any explanation or markdown formatting wrappers like ```json."
    )

    prompt = f"Analyze the following code from the file '{file_name}':\n\n{code_snippet}"

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ScanReport,
                temperature=0.1
            )
        )
        
        if not response.text:
            raise ValueError("No content was returned by the AI model.")
            
        # Parse and return validated Pydantic model
        return ScanReport.model_validate_json(response.text)
    except Exception as e:
        raise RuntimeError(f"AI Scanner service exception: {str(e)}")
