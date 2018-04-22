// Config

// 表格单元设置
let tableRaw = 10
let tableColumn = 10
let tableBase = 60

// 画布大小设置
let canvas = document.getElementById('canvas')
canvas.height = tableBase * tableRaw
canvas.width = tableBase * tableColumn

let ctx = canvas.getContext('2d')

// 机器人配置
let robotStep = tableBase // 机器人
let robotRadius = tableBase / 2
let $robot

const DIRECTION = [
  { x: 0, y: -robotStep },
  // { x: robotStep, y:-robotStep},
  { x: robotStep, y: 0},
  // { x: robotStep, y: robotStep},
  { x: 0, y: robotStep},
  // { x: -robotStep, y: robotStep},
  { x: -robotStep, y: 0},
  // { x: -robotStep, y: -robotStep}
]

// 目的地配置
let $target
let targetConf = {
  width: tableBase,
  height: tableBase
}


// 鼠标信息
let mouse = {
  x: undefined,
  y: undefined
}




// 鼠标事件
canvas.addEventListener('click', function(e) {
  if(window.mode === 'robot') {
    let x = Math.floor(e.offsetX / tableBase) * tableBase + tableBase / 2
    let y = Math.floor(e.offsetY / tableBase) * tableBase + tableBase / 2
    $robot = new Robot(x, y, robotRadius)
  } else if(window.mode === 'map') {
    toggleRect(e.offsetX, e.offsetY)
  } else if(window.mode === 'target') {
    let x = Math.floor(e.offsetX / tableBase) * tableBase
    let y = Math.floor(e.offsetY / tableBase) * tableBase
    $target = new Target(x, y)
  }
})




//   canvas obstacle
//   **********************************************
// 画表格
function drawTable() {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
  for(let i=1; i<tableColumn; i++) {
    ctx.beginPath()
    ctx.moveTo(i * tableBase, 0)
    ctx.lineTo(i * tableBase, canvas.height)
    ctx.stroke()
    ctx.closePath()
  }
  for(let i=1; i<tableRaw; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * tableBase)
    ctx.lineTo(canvas.width, i * tableBase)
    ctx.stroke()
    ctx.closePath()
  }
}

// 障碍物
let rectList = []  //记录障碍物列表

class Rect {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.state = x / tableBase + y / tableBase * tableColumn
    this.position = `${x}:${y}`
  }

  draw() {
      ctx.beginPath()
      ctx.rect(this.x, this.y, tableBase, tableBase)
      ctx.fillStyle = '#000'
      ctx.fill()
      ctx.closePath()
  }
}

// 创建障碍物, 如果已经存在, 则删掉
function toggleRect(offsetX, offsetY) {
  let x = Math.floor(offsetX / tableBase) * tableBase
  let y = Math.floor(offsetY / tableBase) * tableBase
  if(checkToggled(`${x}:${y}`)) {
    //clear has done in checkToggled
  } else {
    rectList.push(new Rect(x, y))
  }


  function checkToggled(flag) {
    for(let index in rectList) {
      if(rectList[index].position === flag) {
        rectList.splice(index, 1)
        return true
      }
    }

    return false
  }
}
// *****************************************************************



// canvas robot
// *****************************************************************
// 机器人
// 分别为上 右上 右 右下 下 左下 左 左上
class Robot {
  constructor(x, y, radius) {
    this.x = Math.floor(x / tableBase) * tableBase + tableBase / 2
    this.y = Math.floor(y / tableBase) * tableBase + tableBase / 2
    // this.x = x
    // this.y = y
    this.radius = radius
    this.goTimer
    this.state = Math.floor(this.x / tableBase) + Math.floor(this.y / tableBase) * tableColumn

    this.from = {
      x: this.x,
      y: this.y,
      state: this.state
    }

    this.targetDistance // 与目标的距离的平方
    this.moveResult
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = 'red'
    ctx.fill()
    ctx.closePath()
  }

  move(direct) {
    if(!this.targetDistance) {
      if(!$target) {
        console.error('没有选目标')
      }
      let deltaX = this.x - ($target.x + tableBase / 2)
      let deltaY = this.y - ($target.y + tableBase / 2)
      this.targetDistance = Math.pow(deltaX, 2) + Math.pow(deltaY, 2)
    }
    // 记录移动前信息
    this.from.x = this.x
    this.from.y = this.y
    this.from.state = this.state
    this.from.targetDistance = this.targetDistance

    this.x += DIRECTION[direct].x
    this.y += DIRECTION[direct].y
    this.state = Math.floor(this.x / tableBase) + Math.floor(this.y / tableBase) * tableColumn

    if(this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.state < 0 || this.state >= tableRaw * tableColumn) {
      this.state = this.from.state
      return this.moveResult = 'dead'
    }

    // getCloserSquareSet()
    if(rectList.length !== 0) {
      for(let rect of rectList) {
        if(collision(this, rect)) {
          this.state = this.from.state
          return this.moveResult = 'dead'
        }
      }

      let deltaX = this.x - ($target.x + tableBase / 2)
      let deltaY = this.y - ($target.y + tableBase / 2)
      this.targetDistance = Math.pow(deltaX, 2) + Math.pow(deltaY, 2)

      if(this.state === $target.position){
        return this.moveResult = 'catch'
      } else if(this.targetDistance < this.from.targetDistance) {
        return this.moveResult = 'closer'
      } else {
        return this.moveResult = 'unnecessary'
      }

    } else {
      if(collision(this, null)) {
        this.moveResult = 'dead'
      } else {
        let deltaX = this.x - ($target.x + tableBase / 2)
        let deltaY = this.y - ($target.y + tableBase / 2)
        this.targetDistance = Math.pow(deltaX, 2) + Math.pow(deltaY, 2)

        if(this.state === $target.position){
          return this.moveResult = 'catch'
        } else if(this.targetDistance < this.from.targetDistance) {
          return this.moveResult = 'closer'
        } else {
          return this.moveResult = 'unnecessary'
        }
      }
    }
  }
}



// 碰撞检测, 假设机器人是圆, 墙壁是正方形
function collision(circle, square) {
  // 画布边界
  // if(circle.x - circle.radius< 0 
  //   || circle.x + circle.radius > canvas.width 
  //   || circle.y - circle.radius < 0 
  //   || circle.y + circle.radius > canvas.height) {
  //     return true
  // } else 
  if(square && circle.state === square.state){ 
      return true
  } else {
      return false
  }
}
// function  collision(circle, square) {
//   // 障碍物中心和圆心的距离
//   let squareCenter = {
//     x: square.x + tableBase/ 2,
//     y: square.y + tableBase / 2
//   }
//   let centerDistance = Math.sqrt(Math.pow(squareCenter.x - circle.x, 2) + Math.pow(squareCenter.y - circle.y, 2))

//   // 画布边界
//   if(circle.x - circle.radius< 0 
//     || circle.x + circle.radius > canvas.width 
//     || circle.y - circle.radius < 0 
//     || circle.y + circle.radius > canvas.height) {
//       return true
//   } else if(centerDistance <= tableBase + circle.radius) { 
//     return true
//   } else if(centerDistance > tableBase * Math.sqrt(2) + circle.radius) {
//     return false
//   } else {
//     // 其他情况
//   }
// }
// ************************************************************


// 目的地 
// ***************************************************
class Target {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.position = x / tableBase + y / tableBase * tableColumn
  }

  draw() {
    ctx.beginPath()
    ctx.rect(this.x, this.y, targetConf.width, targetConf.height)
    ctx.fillStyle = 'orange'
    ctx.fill()
  }
}

// ***************************************************


// 初始化
function init() {
  drawTable()
}

function start() {
  drawTable()
  animate()
}

function animate() {
  requestAnimationFrame(animate)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawTable()
  // 画障碍物
  for(let rect of rectList) {
    rect.draw()
  }

  // 画机器人
  if($robot){
    $robot.draw()
  }

  // 画目的地
  if($target)
    $target.draw()
}

start()