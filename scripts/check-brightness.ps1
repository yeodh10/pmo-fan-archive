# 아카이브 이미지 평균 밝기 검사 — 어두운(까만) 피드 색출
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

Get-ChildItem 'C:\Claude\pmo\public\assets\archive\*.jpg' | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $thumb = New-Object System.Drawing.Bitmap($img, 32, 32)
  $img.Dispose()
  $sum = 0.0
  for ($y = 0; $y -lt 32; $y++) {
    for ($x = 0; $x -lt 32; $x++) {
      $p = $thumb.GetPixel($x, $y)
      $sum += ($p.R + $p.G + $p.B) / 3.0
    }
  }
  $thumb.Dispose()
  [PSCustomObject]@{ File = $_.Name; Brightness = [math]::Round($sum / 1024, 0) }
} | Sort-Object Brightness | Format-Table -AutoSize
