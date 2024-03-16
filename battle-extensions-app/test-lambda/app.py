import requests
import json
import random
import string

analytics_service = "http://localhost:3001/analytics"

def lambda_handler(event, context) -> dict:
    try:
        response = requests.post(
            analytics_service,
            data=json.dumps(
                {
                    "action": "".join(
                        random.choice(string.ascii_lowercase) for i in range(10)
                    )
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        return {"status": "ok"}
    except Exception as error:
        print(f"Error: {error}")
        return {"status": "error"}
