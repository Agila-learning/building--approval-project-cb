$path = "d:\CB Building Approval\frontend\public\assets\logo.jpeg"
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap($img)
# Sample multiple pixels to find non-white color
for($x = 0; $x -lt $bmp.Width; $x += 10) {
    for($y = 0; $y -lt $bmp.Height; $y += 10) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            Write-Output "Found Color: $($c.R), $($c.G), $($c.B)"
            exit
        }
    }
}
