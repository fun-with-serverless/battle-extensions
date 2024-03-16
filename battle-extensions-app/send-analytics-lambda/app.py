import json
import os
import boto3
import random
import string

sqs = boto3.client("sqs")
queue_url = os.environ["SQS_URL"]


def lambda_handler(event, context):
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(
            {
                "action": "".join(
                    random.choice(string.ascii_lowercase) for i in range(10)
                )
            }
        ),
    )
    print(response)
