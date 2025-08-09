import { useEffect, useRef, useState } from "react";

interface PrintObject {
  id: string;
  name: string;
  bbox: number[];
}

interface SkipCardProps {
  imageUrl: string;
  objects: PrintObject[];
  skippedObjects: number[];
  onClick: (id: string) => void;
}

export default function SkipCard({ imageUrl, objects, skippedObjects, onClick }: SkipCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setDimensions({ width: img.width/2, height: img.height/2 });
      drawBoxes();
    };
  }, [imageUrl]);

  useEffect(() => {
    drawBoxes();
  }, [objects, skippedObjects]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clicked = objects.find(obj => {
      const [x1, y1, x2, y2] = obj.bbox;
      return x >= x1 &&
             x <= x2 &&
             y >= (dimensions.height - y2)
             && y <= (dimensions.height - y1);
    });

    if (clicked) {
      onClick(clicked.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !dimensions.height) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const hovered = objects.find(obj => {
      const [x1, y1, x2, y2] = obj.bbox;
      
      return x >= x1 && 
             x <= x2 && 
             y >= (dimensions.height - y2) && 
             y <= (dimensions.height - y1);
    });
  
    setHoveredBox(hovered?.id || null);
    canvasRef.current.style.cursor = hovered ? 'pointer' : 'default' //(skippedObjects.some(obj => obj === Number.parseInt(hovered?.id))? 'default': 'pointer') : 'default';
  };

  const drawBoxes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    objects.forEach(obj => {
      const [x1, y1, x2, y2] = obj.bbox;

      const isHovered = obj.id === hoveredBox;
      const isSkipped = skippedObjects.includes(parseInt(obj.id));
      
      context.lineWidth = isHovered ? 4 : 2;
      context.strokeStyle = isSkipped ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
      context.lineWidth = 2;
      context.fillStyle = isSkipped ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)';

      context.beginPath();
      context.rect(x1, (canvas.height - y1), x2 - x1, (canvas.height - y2) - (canvas.height - y1));
      context.fill();
      context.stroke();

      context.fillStyle = isSkipped ? 'red' : 'green';
    });
  };

  drawBoxes();

  return (
    <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
      <img 
        src={imageUrl} 
        alt="Print preview" 
        className="absolute top-0 left-0"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredBox(null)}
        className="absolute top-0 left-0"
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};