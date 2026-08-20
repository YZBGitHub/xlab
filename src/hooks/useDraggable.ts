import React, { useState, useRef, useEffect } from 'react';

export function useDraggable(initialPosition = { x: 0, y: 0 }, onDrag?: (pos: {x: number, y: number}) => void) {
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const onDragRef = useRef(onDrag);

  useEffect(() => {
    onDragRef.current = onDrag;
  }, [onDrag]);

  const handleMouseDown = (e: React.MouseEvent | MouseEvent) => {
    isDragging.current = true;
    dragStartPos.current = {
      x: (e as React.MouseEvent).clientX - position.x,
      y: (e as React.MouseEvent).clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newPos = { x: e.clientX - dragStartPos.current.x, y: e.clientY - dragStartPos.current.y };
      setPosition(newPos);
      if (onDragRef.current) onDragRef.current(newPos);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return { position, handleMouseDown };
}
