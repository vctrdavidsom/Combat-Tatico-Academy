const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000"

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") || ""

  const response = await fetch(`${API_BASE_URL}/library/student/items`, {
    method: "GET",
    headers: {
      Authorization: authorization
    }
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
