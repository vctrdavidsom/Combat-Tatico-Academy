const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  const authorization = request.headers.get("authorization") || ""
  const { id } = await context.params

  const response = await fetch(
    `${API_BASE_URL}/certificates/student/certificates/${id}/download`,
    {
      method: "GET",
      headers: {
        Authorization: authorization
      }
    }
  )

  const contentType = response.headers.get("content-type") || "application/pdf"
  const contentDisposition = response.headers.get("content-disposition") || "attachment"
  const body = await response.arrayBuffer()

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition
    }
  })
}
