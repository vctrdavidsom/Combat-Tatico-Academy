const API_BASE_URL = "http://localhost:8000"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  const authorization = request.headers.get("authorization") || ""
  const { id } = await context.params

  const response = await fetch(`${API_BASE_URL}/lessons/admin/modules/${id}/lessons`, {
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

export async function POST(request: Request, context: RouteContext) {
  const authorization = request.headers.get("authorization") || ""
  const { id } = await context.params
  const raw = await request.text()
  const contentType = request.headers.get("content-type") || "application/json"

  const response = await fetch(`${API_BASE_URL}/lessons/admin/modules/${id}/lessons`, {
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
