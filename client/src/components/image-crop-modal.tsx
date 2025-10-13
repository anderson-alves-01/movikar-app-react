import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZoomIn, ZoomOut, Crop, Paintbrush, Eraser } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawPoint {
  x: number;
  y: number;
}

export function ImageCropModal({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [activeTab, setActiveTab] = useState<'crop' | 'blur'>('crop');
  
  // Blur tool states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [blurPaths, setBlurPaths] = useState<DrawPoint[][]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([]);
  const [brushSize, setBrushSize] = useState(30);
  const [imageLoaded, setImageLoaded] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Load image on blur tab
  useEffect(() => {
    if (activeTab === 'blur' && canvasRef.current && !imageLoaded) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setImageLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [activeTab, imageSrc, imageLoaded]);

  // Redraw canvas with blur paths
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw blur indicator paths
      blurPaths.forEach(path => {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        path.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      });
    };
    img.src = imageSrc;
  }, [blurPaths, brushSize, imageSrc]);

  useEffect(() => {
    if (imageLoaded && blurPaths.length > 0) {
      redrawCanvas();
    }
  }, [blurPaths, imageLoaded, redrawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'blur') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTab !== 'blur') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCurrentPath(prev => [...prev, { x, y }]);

    // Draw current path in real-time
    const ctx = canvas.getContext('2d');
    if (ctx && currentPath.length > 0) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 0) {
      setBlurPaths(prev => [...prev, currentPath]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const clearBlurPaths = () => {
    setBlurPaths([]);
    redrawCanvas();
  };

  const applyBlurEffect = useCallback(async () => {
    if (blurPaths.length === 0) return imageSrc;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    const img = new Image();
    img.src = imageSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Apply blur to each path
    blurPaths.forEach(path => {
      path.forEach(point => {
        const radius = brushSize / 2;
        const imageData = ctx.getImageData(
          Math.max(0, point.x - radius),
          Math.max(0, point.y - radius),
          Math.min(canvas.width, radius * 2),
          Math.min(canvas.height, radius * 2)
        );

        // Apply pixelation effect (stronger blur)
        const pixelSize = 15;
        for (let y = 0; y < imageData.height; y += pixelSize) {
          for (let x = 0; x < imageData.width; x += pixelSize) {
            const i = (y * imageData.width + x) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];

            for (let py = 0; py < pixelSize && y + py < imageData.height; py++) {
              for (let px = 0; px < pixelSize && x + px < imageData.width; px++) {
                const pi = ((y + py) * imageData.width + (x + px)) * 4;
                imageData.data[pi] = r;
                imageData.data[pi + 1] = g;
                imageData.data[pi + 2] = b;
              }
            }
          }
        }

        ctx.putImageData(
          imageData,
          Math.max(0, point.x - radius),
          Math.max(0, point.y - radius)
        );
      });
    });

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [blurPaths, brushSize, imageSrc]);

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      // Apply blur first if there are blur paths
      const processedImageSrc = await applyBlurEffect();

      const image = new Image();
      image.src = processedImageSrc;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onCropComplete(base64data);
          onClose();
        };
      }, 'image/jpeg', 0.95);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  }, [croppedAreaPixels, applyBlurEffect, onCropComplete, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Ajustar Imagem
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'crop' | 'blur')} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crop" className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Cortar
            </TabsTrigger>
            <TabsTrigger value="blur" className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4" />
              Borrar Detalhes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="space-y-4 mt-4">
            <div className="relative flex-1 bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteCallback}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomOut className="h-4 w-4" />
                  Zoom
                  <ZoomIn className="h-4 w-4" />
                </label>
                <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
                data-testid="slider-zoom"
              />
            </div>
          </TabsContent>

          <TabsContent value="blur" className="space-y-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <Paintbrush className="h-4 w-4 inline mr-2" />
              Desenhe sobre as áreas que deseja borrar (placas, rostos, etc.)
            </div>

            <div className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '400px' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full max-h-[400px] cursor-crosshair"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Paintbrush className="h-4 w-4" />
                  Tamanho do Pincel
                </label>
                <span className="text-sm text-muted-foreground">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                onValueChange={(values) => setBrushSize(values[0])}
                min={10}
                max={80}
                step={5}
                className="w-full"
                data-testid="slider-brush-size"
              />
            </div>

            <Button
              variant="outline"
              onClick={clearBlurPaths}
              className="w-full"
              disabled={blurPaths.length === 0}
              data-testid="button-clear-blur"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-crop">
            Cancelar
          </Button>
          <Button onClick={createCroppedImage} data-testid="button-apply-crop">
            Aplicar Ajustes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
