import boto3
import os

s3 = boto3.client('s3', aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'), aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))

def upload_to_s3(file, filename):
    s3.upload_fileobj(file, os.getenv('S3_BUCKET_NAME'), filename)
    return f"https://{os.getenv('S3_BUCKET_NAME')}.s3.amazonaws.com/{filename}"