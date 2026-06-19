FROM public.ecr.aws/lambda/python:3.12

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy function code and model
COPY lambda_function.py ${LAMBDA_TASK_ROOT}
COPY water_classifier.onnx ${LAMBDA_TASK_ROOT}

# Set the CMD to the handler
CMD [ "lambda_function.lambda_handler" ]
