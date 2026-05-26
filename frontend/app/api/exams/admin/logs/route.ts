const API_BASE_URL = "http://localhost:8000"

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") || ""
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  const examId = searchParams.get("exam_id")
  const query = new URLSearchParams()
  if (userId) query.set("user_id", userId)
  if (examId) query.set("exam_id", examId)
  const queryString = query.toString()

  const response = await fetch(`${API_BASE_URL}/exams/admin/logs${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        Authorization: authorization
      }
    }
  )

  const responseBody = await response.text()
  const responseContentType = response.headers.get("content-type") || "application/json"

  return new Response(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": responseContentType
    }
  })
}
