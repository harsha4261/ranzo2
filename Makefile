.PHONY: backend frontend cloudflare all

# Start the FastAPI backend
backend:
	cd backend && uv run uvicorn main:app --reload --port 8000

# Start the React Native / Expo frontend
frontend:
	cd Frontend && npm start

# Start a Cloudflare tunnel pointing to the backend
cloudflare:
	cloudflared tunnel --url http://localhost:8000

# Run all three services in parallel
all:
	make -j 3 backend frontend cloudflare
