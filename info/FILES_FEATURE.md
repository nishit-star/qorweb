# Files Feature (n8n → MongoDB → Frontend)

Environment variables required:

```
MONGODB_URI=mongodb+srv://Welzin:yYsuyoXrWcxPKmPV@welzin.1ln7rs4.mongodb.net/?retryWrites=true&w=majority&appName=Welzin
MONGODB_DB=welzin
MONGODB_COLLECTION=files
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Endpoints:
- POST /api/files/callback — n8n can POST the fields { llm, robots, schema, faq, jobId? }
- GET /api/files/list — returns a list of four downloadable files from the latest document
- GET /api/files/download?name=llm.txt|robots.txt|schema.org|faq.txt — downloads content

UI:
- /files — Files tab to list and download the four files

Notes:
- If callback receives the fields, it inserts a new document. Otherwise, backend always serves from the latest document in the collection.
- schema.org is served with application/ld+json content type; others are text/plain.
