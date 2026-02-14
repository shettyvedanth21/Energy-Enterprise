FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# default device id for demo
ENV DEVICE_ID=D1

CMD ["sh", "-c", "python main.py --device-id ${DEVICE_ID}"]