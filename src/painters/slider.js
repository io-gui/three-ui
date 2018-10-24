class SliderPainter {
  static get inputProperties() {
    return [
      '--slider-background',
      '--slider-color-start',
      '--slider-color-end',
      '--slider-min',
      '--slider-max',
      '--slider-step',
      '--slider-value'
    ];
  }
  paint(ctx, geom, properties) {
    const bgColor = String(properties.get('--slider-background')) || '#888';
    const colorStart = String(properties.get('--slider-color-start')) || '#2cf';
    const colorEnd = String(properties.get('--slider-color-end')) || '#2f6';
    const min = parseFloat(properties.get('--slider-min'));
    const max = parseFloat(properties.get('--slider-max'));
    const step = parseFloat(properties.get('--slider-step'));
    const value = parseFloat(properties.get('--slider-value'));

    if (isNaN(value)) return;

    const w = geom.width, h = geom.height;
    const handleWidth = 4;

    let snap = Math.floor(min / step) * step;
    let pos;

    if (((max - min) / step) < w / 3 ) {
      while (snap < (max - step)) {
        snap += step;
        pos = Math.floor(w * (snap - min) / (max - min));
        ctx.lineWidth = .5;
        ctx.strokeStyle = bgColor;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, h);
        ctx.stroke();
      }
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, h / 2 - 2, w, 4);

    pos = handleWidth / 2 + (w - handleWidth) * (value - min) / (max - min);
    const gradient = ctx.createLinearGradient(0, 0, pos, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, h / 2 - 2, pos, 4);

    ctx.lineWidth = handleWidth;
    ctx.strokeStyle = colorEnd;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, h);
    ctx.stroke();
  }
}

registerPaint('slider', SliderPainter);
