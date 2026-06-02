const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000"

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || ""
  const raw = await request.text()
  const contentType = request.headers.get("content-type") || "application/json"

  const response = await fetch(`${API_BASE_URL}/users/admin/create-admin`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType
    },
    body: raw
  })

  const responseBody = await response.text()
  const responseContentType = response.headers.get("content-type") || "application/json"

  return new Response(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": responseContentType
    }
  })
}
