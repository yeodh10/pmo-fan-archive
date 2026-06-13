# 어두운 피드 정리: AF1은 신발 사진 영역만 크롭, 나머지는 제거/개명
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$dir = 'C:\Claude\pmo\public\assets\archive'

# 1) AF1 Para-Noise — 어워드 그래픽 중앙의 신발 밴드만 크롭 (1440x1440 기준)
$p = Join-Path $dir '2019_shoes_nike-af1-paranoise.jpg'
$src = [System.Drawing.Image]::FromFile($p)
$crop = New-Object System.Drawing.Rectangle(0, 355, 1440, 730)
$bmp = New-Object System.Drawing.Bitmap(1440, 730)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, 1440, 730)), $crop, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose(); $src.Dispose()
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)
$tmp = Join-Path $dir '_af1_tmp.jpg'
$bmp.Save($tmp, $enc, $ep); $bmp.Dispose()
Move-Item $tmp $p -Force
Write-Output 'AF1 크롭 완료'

# 2) 어두워서 못 쓰는 항목 제거
@('2019_shirts_red-hoodie.jpg', '2016_outer_denim-jacket.jpg', '2016_accessory_earphones-red.jpg') | ForEach-Object {
  $f = Join-Path $dir $_
  if (Test-Path $f) { Remove-Item $f -Force -Confirm:$false; Write-Output "제거: $_" }
}

# 3) 잘못 매핑된 클립 파우치 → 디스트레스드 심볼 캡
$old = Join-Path $dir '2016_accessory_clip-pouch.jpg'
$new = Join-Path $dir '2016_cap_distressed-symbol-cap.jpg'
if (Test-Path $old) { Move-Item $old $new -Force; Write-Output '개명: clip-pouch → distressed-symbol-cap' }
