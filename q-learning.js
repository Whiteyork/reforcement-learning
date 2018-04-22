// Initialize Q arbitrarily 随机初始化Q表
// Repeat (for each episode) : // 每一次游戏都是一个episode
//   Initialize S 初始化初始状态
//   Repeat (for each step of episode) 
//     根据当前Q和S, 使用一种策略, 得到动作A
//     做了动作A, 得到新状态S', 并获得奖励R
//   until S is terminal

const REWARD = {
  closer: 0,
  unnecessary: 0,  
  dead: -1000,
  catch: 1000
}

let bestPath = []
/**
 *  Q learning
 * @param {Object}  initParam  初始化信息
 * @param {Robot} agent  机器人
 * @param {Array} actionType
 * @param {Target} target  寻找的目标
 * @param {Number} lamba 衰减率
 * @param {Number} alpha 学习率
 * @param {Number} eGreedy ε-greedy值,随机选取的概率
 */
class Qlearning {
  constructor(agent, actionType = DIRECTION, lambda, alpha, eGreedy) {
    this.agent = agent
    this.defaultAgent = {
      x: agent.x,
      y: agent.y,
      radius: agent.radius
    }

    this.actionType = actionType
    this.lambda = lambda
    this.alpha = alpha
    this.eGreedy = eGreedy

    this.qTable = []
    for(let i=0; i<tableRaw * tableColumn; i++) {
      this.qTable.push([])
      for(let j=0; j<actionType.length; j++) {
        this.qTable[i].push(0)
      }
    }


    this.action 
  }

  train(times) {
    let timer
      // 根据policy选择action
      let _train = () => {
        $robot = this.agent = new Robot(this.defaultAgent.x, this.defaultAgent.y, this.defaultAgent.radius)
        timer = setInterval(() => {
          this.action = this.policy()

          // action
          this.agent.move(this.action)

          // update Q-table
          this.updateQ()
          // 开始下一轮
          if(this.agent.moveResult === 'catch' || this.agent.moveResult === 'dead'){
            console.log(this.agent.moveResult)

            clearInterval(timer)

            if(--times !== 0) {
              _train()
            }
          }
        }, 10)
      }
      
      _train()

  }

  getQ(state, action) {
    return this.qTable[state][action]
  }
  updateQ() {
    // Q(s,a)=r+γ(max(Q(s′,a′))
    // Q(S,A) ← (1-α)*Q(S,A) + α*[R + γ*maxQ(S',a)]
    let state = this.agent.from.state
    let action = this.action
    // this.qTable[state][action] = this.getQ(state, action) + this.alpha * (this.reward() + this.lambda * this.getQMax().value - this.getQ(state, action))
    this.qTable[state][action] = this.reward() + this.lambda * this.getQMax().value 
  }

  getQMax() {
    let qRaw = this.qTable[this.agent.state]
    let max = qRaw[0]
    let bestAction = 0

    for(let action in qRaw) {
      if(qRaw[action] > max) {
        max = qRaw[action]
        // console.log('bestAction: ', bestAction)
        bestAction = action
      }
    }
    return {
      bestAction: bestAction,
      value: max
    }
  }

  reward() {
    return REWARD[this.agent.moveResult]
  }

  policy() {
    if(!this.action) {
      return Math.floor(Math.random() * this.actionType.length)
    } else {
      if(Math.random() <= this.eGreedy) {
        return this.getQMax().bestAction
      } else {
        return Math.floor(Math.random() * this.actionType.length)
      }
    }
  }
}