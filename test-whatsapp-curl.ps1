$headers = @{
    'Authorization' = 'Bearer EAAtLDXi1ZBYQBRapOnZBUAVZBdng8Q1PEepccVnpvpQCOoZC5SZCPXXOhwPcsoryGQr3uDMoDnwOKxRMPZA0Rq8HD1jhrUvDVyI7FoZAwMmRRwhnjgdY7BVIJFApRDYvbaYBJZAFhgfyQAOQldIgFsEXJM1dp6zXKyzD3h0tSCTZA9GUtzvG4jpPOeCH4rIDkCoIlw2wFqQ5BCMO5P8E06qv55p5cSePDqIZCIXdAqZCFIv6U5jRNPZCm6PYUrVsGWBp2ZCKLjhZAm8TVyPqp0Ux3aqdZB7'
    'Content-Type' = 'application/json'
}

$body = @{
    messaging_product = 'whatsapp'
    to = '27730210062'
    type = 'text'
    text = @{
        body = '🇿🇼 Test from our delivery platform! Your WhatsApp integration is working!'
    }
} | ConvertTo-Json

Write-Host "🧪 Testing WhatsApp API with curl equivalent..."
Write-Host "📤 Sending message to 27730210062..."

try {
    $response = Invoke-RestMethod -Uri 'https://graph.facebook.com/v25.0/1169872976198533/messages' -Method POST -Headers $headers -Body $body
    Write-Host "✅ Message sent successfully!"
    Write-Host "📬 Response: $($response | ConvertTo-Json -Depth 10)"
} 
catch {
    Write-Host "❌ Failed to send message"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "Response: $errorText"
    }
}
