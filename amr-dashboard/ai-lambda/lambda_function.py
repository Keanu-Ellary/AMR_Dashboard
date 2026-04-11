import json
import base64
import io
import numpy as np
import onnxruntime as ort
from PIL import Image

# Initialize the ONNX session outside the handler for performance (warm start)
MODEL_PATH = "algae_detector.onnx"
session = ort.InferenceSession(MODEL_PATH)

def preprocess_image(image_bytes):
    # Open image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Resize to typical generic input shape, e.g., 224x224
    image = image.resize((800, 800), Image.Resampling.BILINEAR)
    # Convert to numpy array and normalize
    img_data = np.array(image).astype('float32') / 255.0
    # Change data layout from HWC to CHW
    img_data = np.transpose(img_data, (2, 0, 1))
    # Add batch dimension
    img_data = np.expand_dims(img_data, axis=0)
    return img_data

def lambda_handler(event, context):
    try:
        # Handle different event formats (API Gateway, direct invocation, etc.)
        body = event.get('body', event)

        # If body is a string, it might be JSON or a raw base64 string
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                # If it fails to parse as JSON, assume the body itself might be the base64 string
                pass

        # Extract base64 encoded image string
        b64_image = ''
        if isinstance(body, dict):
            b64_image = body.get('image', '')
        elif isinstance(body, str):
            b64_image = body

        # Fallback to checking the event directly if not found
        if not b64_image and isinstance(event, dict):
            b64_image = event.get('image', '')

        if not b64_image:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No image provided in "image" key or body.'})
            }

        # Decode base64
        image_bytes = base64.b64decode(b64_image)

        # Preprocess
        input_data = preprocess_image(image_bytes)

        # Run inference
        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: input_data})

        # Flatten extra dimensions to get a 2D array of boxes (num_boxes, 6)
        preds = np.array(outputs[0]).reshape(-1, 6)

        # Filter boxes where confidence (index 4) is greater than 20%
        filtered_preds = preds[preds[:, 4] > 0.20]

        # Convert output to list for JSON serialization
        results = filtered_preds.tolist()

        return {
            'statusCode': 200,
            'body': json.dumps({'results': results})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
