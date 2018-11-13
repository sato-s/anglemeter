import paper from 'paper/dist/paper-core'
import Model from './Model'
import Crosslight from './Crosslight'

const defaultOptions = {
  src: null,
  strokeColor: 'black',
  fillColor: 'white',
  bindTo: 'anglemeter',
  radius: 70,
  half: false,
  enableCrossLight: false,
}


export class AngleMeter {
  constructor(inputOptions) {
    console.log('--------')
    const options = {}
    Object.assign(options, defaultOptions, inputOptions)
    // Create instance specific paper scope to take care of multiple canvases
    this.paper = new paper.PaperScope();
    this.angle = 0
    this.angleHistory = []

    this.config = {
      radius: options.radius,
      half: options.half,
      enableCrossLight: options.enableCrossLight,
			baseCirclePadding: options.radius / 3,
      strokeColor: options.strokeColor,
      bindTo: options.bindTo,
      fillColor: options.fillColor,
      scale: {
        sub : {
          interval: 5,
          factor: 0.93,
          color: 'black',
          width: 1,
        },
        primary: {
          interval: 45,
          factor: 0.9,
          color: 'black',
          width: 1.5,
        },
      },
      crosslight: {
        color: 'grey',
        padding: 10,
        width: 2,
      },
      indicator: {
        color: 'blue',
        radius: options.radius / 6,
        opacity: 0.8,
      },
			angleLabel: {
        opacity: 0.8,
				color: 'black',
				fontSize: (options.radius / 6),
			},
      histgram: {
        color: 'blue',
        factor: 0.94,
        width: 2,
        opacity: 0.4,
      },
      models: [
        {
          id: 'model',
          src: options.src,
          scaleFactor: 0.6,
        },
        {
          id: 'model',
          src: options.src,
          scaleFactor: 0.6,
        },
      ]
      ,
    }

    this.center= new this.paper.Point(
			options.radius + this.config.baseCirclePadding,
			options.radius + this.config.baseCirclePadding
		)
  }

  draw(){
    var canvas = document.getElementById(this.config.bindTo);
    this.paper.setup(canvas);
    this.drawBaseCircle()
    this.drawScale()
    // Model
    let box = this.getModelBoundingBox()
    var model = new Model(this.paper, this.config.models[0].src, box, this.config.models[0].scaleFactor, this.center)
    // crosslight
    new Crosslight(
      this.paper,
      this.radius,
      this.config.crosslight.padding,
      this.center,
      this.config.crosslight.color,
      this.config.crosslight.width,
    )
    this.drawIndicator()
		this.drawCurrentAngleLabel()
    if (this.config.enableCrossLight){
      this.drawCrossLight()
    }
    this.paper.view.draw();
  }

  rotateInternal(absAngle){
    let relativeAngle = - (this.angle - absAngle)
    this.model.rotate(relativeAngle, this.center)
    if (this.config.enableCrossLight){
      this.crosslight.rotate(relativeAngle, this.center)
    }
    this.indicator.rotate(relativeAngle, this.center)
		this.currentAngleLabelPosition = this.currentAngleLabelPosition.rotate(relativeAngle, this.center)
    this.currentAngleLabel.position = this.currentAngleLabelPosition
    this.currentAngleLabel.content = absAngle
    this.angle = absAngle
  }

  rotateSafe(absAngle){
    this.paper.activate()
    if (this.model == null){
      this.angleHistory.push(absAngle)
    }else{
      this.rotateInternal(absAngle)
    }
  }

  rotate(absAngle){
    this.rotateSafe(absAngle)
  }

  rotateWithHistgram(absAngle){
    this.rotateSafe(absAngle)
    this.drawHistgram(absAngle)
  }

  drawBaseCircle(){
    this.circle = new this.paper.Path.Circle({
      center: this.center,
      radius: this.config.radius,
    });
    if (this.config.half){
      // If this is `half` draw arc instead of circle
      let start = new paper.Point(this.center.x - this.config.radius, this.center.y)
      let through = new paper.Point(this.center.x, this.center.y - this.config.radius)
      let end = new paper.Point(this.center.x + this.config.radius, this.center.y)
      let arc = new paper.Path.Arc(start, through, end)
      arc.strokeColor = this.config.strokeColor;
      arc.fillColor = this.config.fillColor;
    }
    else{
      this.circle.strokeColor = this.config.strokeColor;
      this.circle.fillColor = this.config.fillColor;
    }
  }

  drawCrossLight(){
    this.paper.activate()
    let halfLength = this.config.radius - this.config.crosslight.padding
    var start = new this.paper.Point(this.center.x, this.center.y - halfLength)
    var end = new this.paper.Point(this.center.x, this.center.y + halfLength)
    let path1 = new this.paper.Path.Line(start, end)
    path1.strokeColor = this.config.crosslight.color
    path1.strokeWidth = this.config.crosslight.width
    path1.dashArray = [2, 2]

    var start = new this.paper.Point(this.center.x - halfLength, this.center.y)
    var end = new this.paper.Point(this.center.x + halfLength, this.center.y)
    let path2 = new this.paper.Path.Line(start, end)
    path2.strokeColor = this.config.crosslight.color
    path2.strokeWidth = this.config.crosslight.width
    path2.dashArray = [2, 2]

    this.crosslight = new this.paper.Group([path1, path2])
  }

  drawIndicator(){
    let center =
      new this.paper.Point(this.center.x, this.center.y - this.config.radius - this.config.indicator.radius - 3)
    this.indicator = new this.paper.Path.RegularPolygon(center, 3, this.config.indicator.radius);
    this.indicator.rotate(180, center)
    this.indicator.scale(0.4, 1, center)
    this.indicator.fillColor = this.config.indicator.color;
    this.indicator.opacity = this.config.indicator.opacity;
  }

  drawCurrentAngleLabel(){
    this.currentAngleLabelPosition =
      new this.paper.Point(
				this.center.x,
				this.center.y - this.config.radius - this.config.indicator.radius - 18
			)
		this.currentAngleLabel = new this.paper.PointText({
			point: this.currentAngleLabelPosition,
			justification: 'center',
			fontSize: this.config.angleLabel.fontSize,
			fillColor: this.config.angleLabel.color,
		});
		this.currentAngleLabel.content = this.angle
  }

  drawScale(){
    let startAngle = this.config.half ? -90 : -180
    let endAngle = this.config.half ? 90 : 180
    for (var angle = startAngle; angle <= endAngle; angle = angle + this.config.scale.sub.interval) {
      if (angle % this.config.scale.primary.interval == 0){
        this.drawRadiusLine(
          angle,
          this.config.scale.primary.width,
          this.config.scale.primary.color,
          this.config.scale.primary.factor
        )
      }else{
        this.drawRadiusLine(
          angle,
          this.config.scale.sub.width,
          this.config.scale.sub.color,
          this.config.scale.sub.factor
        )
      }
    }
  }

  drawLabel(point, text){
    let pointText = new this.paper.PointText(point)
    pointText.justification = 'center';
    pointText.content = text
  }

  drawHistgram(angle){
    this.drawRadiusLine(
      angle,
      this.config.histgram.width,
      this.config.histgram.color,
      this.config.histgram.factor,
      this.config.histgram.opacity
    )
  }

  drawRadiusLine(angle, width, color, factor, opacity=1){
    let start = new this.paper.Point(this.center.x, this.center.y - this.config.radius)
    let _end  = this.center
    var vector = start.subtract(_end)
    vector = vector.multiply(factor)
    let end = _end.add(vector)
    let path = new this.paper.Path.Line(start, end)
    path.strokeColor = color
    path.strokeWidth = width
    path.opacity = opacity
    path.rotate(angle, this.center)
  }

  getBoundaryPointAtAgnle(angle){
    var point = new this.paper.Point(this.center.x, this.center.y - this.config.radius)
    return point.rotate(angle, this.center)
  }

  getModelBoundingBox(){
    let vector = new this.paper.Point(this.config.radius, this.config.radius)
    let topLeft = this.center.subtract(vector)
    let box = new this.paper.Rectangle(topLeft, this.config.radius * 2)
    return box
  }

}
