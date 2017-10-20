// TODO: set userId on bid
// TODO: re-wrtie update function to not be general but specific cases


/*
  eslint-disable react/prefer-stateless-function, react/jsx-boolean-value,
  no-undef, jsx-a11y/label-has-for, react/jsx-first-prop-new-line
*/
const taskEvaluationTime = 25000;
class TaskDashboard extends React.Component {
  state = {
    tasks: []
  };

  componentDidMount() {
    this.loadTasksFromServer();
    setInterval(this.loadTasksFromServer, 5000);
  }

  loadTasksFromServer = () => {
    client.getTasks((serverTasks) => (
        this.setState({ tasks: serverTasks })
      )
    );
  };

  handleCreateFormSubmit = (task) => {
    this.createTask(task);
  };

  handleEditFormSubmit = (attrs) => {
    this.updateTask(attrs);
  };

  handleDeleteClick = (taskId) => {
    this.deleteTask(taskId);
  };

  handleStartClick = (taskId) => {
    this.startTimer(taskId);
  };

  handleRestartClick = (taskId) => {
    const now = Date.now();
    this.updateTask({
      id: taskId,
      startedTime: now,
      bids: null,
    });
  };

  handleBidClick = (taskId, bidValue) => {
    this.updateTask({
      id: taskId,
      bid: {
        bidder: 'TBD',
        bid: bidValue,
      },
    });
  }

  createTask = (task) => {
    const t = helpers.newTask(task);
    this.setState({
      tasks: this.state.tasks.concat(t),
    });

    client.createTask(t);
  };

  deleteTask = (taskId) => {
    this.setState({
      tasks: this.state.tasks.filter((t) => t.id !== taskId)
    });

    client.deleteTask({
      id: taskId
    });
  };

  // TODO: a big all encompasing update seems like poor practice - you should break up into very speciic update tasks: start, restart, updateText
  //       and pass to specific funcitons in the DAL
  updateTask = (attrs) => {
    let updateTask;

    this.setState({
      tasks: this.state.tasks.map((task) => {
        if (task.id === attrs.id) {
          let bids = null;
          if (attrs.bid){
            bids = (task.bids) ? task.bids.concat(attrs.bid) : Array(attrs.bid);
          } else if (attrs.bids !== null){
            bids = task.bids;
          }

          updateTask = Object.assign({}, task, {
            title: attrs.title || task.title,
            subtitle: attrs.subtitle || task.subtitle,
            bids: bids,
            startedTime: attrs.startedTime || task.startedTime,
          });

          return updateTask;
        } else {
          return task;
        }
      }),
    });

    if (updateTask) {
      client.updateTask(updateTask);
    }
  };

  startTimer = (taskId) => {
    const now = Date.now();
    this.updateTask({
      id: taskId,
      startedTime: now,
    });

    client.startTask({
      id: taskId,
      startedTime: now
    });
  };

  render() {
    return (
      <div className='ui three column centered grid'>
        <div className='column'>
          <EditableTaskList
           tasks={this.state.tasks}
           onFormSubmit={this.handleEditFormSubmit}
           onDeleteClick={this.handleDeleteClick}
           onStartClick={this.handleStartClick}
           onRestartClick={this.handleRestartClick}
           onBidClick={this.handleBidClick}
          />
          <ToggleableTaskForm
            isOpen={false}
            onFormSubmit={this.handleCreateFormSubmit}
          />
        </div>
      </div>
    );
  }
}

class ToggleableTaskForm extends React.Component {
  state = {
    isOpen: false
  };

  handleFormOpen = () => {
    this.setState({
      isOpen: true
    });
  };

  handleFormClose = () => {
    this.setState({ isOpen: false });
  };

  handleFormSubmit = (task) => {
    this.props.onFormSubmit(task);
    this.setState({ isOpen: false });
  };

  render() {
    if (this.state.isOpen) {
      return (
        <TaskForm
        onFormSubmit={this.handleFormSubmit}
        onFormClose={this.handleFormClose}
        />
      );
    } else {
      return (
        <div className='ui basic content center aligned segment'>
          <button
            className='ui basic button icon'
            onClick={this.handleFormOpen}
          >
            <i className='plus icon' />
          </button>
        </div>
      );
    }
  }
}

class EditableTaskList extends React.Component {
  render() {
    const tasks = this.props.tasks.map((task) => (
      <EditableTask
        key={task.id}
        id={task.id}
        title={task.title}
        subtitle={task.subtitle}
        startedTime={task.startedTime}
        bids={task.bids}
        onFormSubmit={this.props.onFormSubmit}
        onDeleteClick={this.props.onDeleteClick}
        onStartClick={this.props.onStartClick}
        onRestartClick={this.props.onRestartClick}
        onBidClick={this.props.onBidClick}
      />
    ));
    return (
      <div id='tasks'>
        {tasks}
      </div>
    );
  }
}

class EditableTask extends React.Component {
  state = {
    isEditOpen: false,
  };

  handleEditClick = () => {
    this.setState({
      isEditOpen: true,
    });
  };

  handleFormClose = () => {
    this.setState({
      isEditOpen: false,
    });
  };

  handleTaskStart = () => {
    this.props.onStartClick(this.props.id);
  };

  handleTimeOut = () => {
  };

  handleRedoClick = () => {
    this.props.onRestartClick(this.props.id);
  };

  handleFormSubmit = (task) => {
    this.props.onFormSubmit(task);
    this.setState({
      isEditOpen: false,
    });
  };

  render() {
    const VIEW_STATES = {
      EDIT_FORM: 0,
      UNEVALUATED: 1,
      EVALUATING: 2,
      EVALUATED: 3,
    };
    const now = Date.now();
    let currentView = VIEW_STATES.UNEVALUATED;

    // TODO: rewrite this big o'le if statement
    if (this.props.startedTime){
      if (this.props.startedTime + taskEvaluationTime <= now){
        currentView = VIEW_STATES.EVALUATED;
      } else {
        currentView = VIEW_STATES.EVALUATING;
      }
    } else if (this.state.isEditOpen) { // Note: it is important that we check startedTime before checking for editFormOpen
      currentView = VIEW_STATES.EDIT_FORM;
    }

    switch (currentView) {
      case VIEW_STATES.EDIT_FORM:
        return (
          <TaskForm
            id={this.props.id}
            title={this.props.title}
            subtitle={this.props.subtitle}
            onFormSubmit={this.handleFormSubmit}
            onFormClose={this.handleFormClose}
          />
        );
        break;
      case VIEW_STATES.UNEVALUATED:
        return (
          <Task
            id={this.props.id}
            title={this.props.title}
            subtitle={this.props.subtitle}
            onStartClick={this.handleTaskStart}
            onEditClick={this.handleEditClick}
            onDeleteClick={this.props.onDeleteClick}
          />
        );
      break;
      case VIEW_STATES.EVALUATING:
        return (
          <EvaluatingTask
            id={this.props.id}
            title={this.props.title}
            subtitle={this.props.subtitle}
            bids={this.props.bids}
            startedTime={this.props.startedTime}
            onTimeOut={this.handleTimeOut}
            onBidClick={this.props.onBidClick}
           />
        );
      break;
        case VIEW_STATES.EVALUATED:
        return (
          <EvaluatedTask
            id={this.props.id}
            title={this.props.title}
            subtitle={this.props.subtitle}
            bids={this.props.bids || []} // TODO: better error handling for no bids
            onRedoClick={this.handleRedoClick}
            onDeleteClick={this.props.onDeleteClick}
            onBidClick={this.props.onBidClick}
          />
        );
      break;
      default:
        return (
          <div></div>
        );
    }
  }
}

// TODO:rename to UnevaluatedTask
class Task extends React.Component {
  handleDeleteClick = () => {
    this.props.onDeleteClick(this.props.id);
  }

  render() {
    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='header'>
            {this.props.title}
          </div>
          <div className='meta'>
            {this.props.subtitle}
          </div>
          <div className='extra content'>
            <span
              className='right floated edit icon'
              onClick={this.props.onEditClick}
            >
              <i className='edit icon' />
            </span>
            <span
              className='right floated trash icon'
              onClick={this.handleDeleteClick}
            >
              <i className='trash icon' />
            </span>
          </div>
        </div>
        <div
          className='ui bottom attached blue basic button'
          onClick={this.props.onStartClick}
        >
          Start
        </div>
      </div>
    );
  }
}

class TaskForm extends React.Component {
  state = {
    title: this.props.title || '',
    subtitle: this.props.subtitle || ''
  }

  handleTitleChange = (e) => {
    this.setState({
      title: e.target.value
    });
  };
  handleSubTitleChange = (e) => {
    this.setState({
      subtitle: e.target.value
    });
  };
  handleSubmit = () => {
    this.props.onFormSubmit({
      id: this.props.id,
      title: this.state.title,
      subtitle: this.state.subtitle,
    });
  };

  render() {
    const submitText = this.props.id ? 'Update' : 'Create';
    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='ui form'>
            <div className='field'>
              <label>Title</label>
              <input
                type='text'
                value={this.state.title}
                onChange={this.handleTitleChange}
              />
            </div>
            <div className='field'>
              <label>Subtitle</label>
              <input
                type='text'
                value={this.state.subtitle}
                onChange={this.handleSubTitleChange}
              />
            </div>
            <div className='ui two bottom attached buttons'>
              <button
                className='ui basic blue button'
                onClick={this.handleSubmit}
              >
                {submitText}
              </button>
              <button
                className='ui basic red button'
                onClick={this.props.onFormClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class EvaluatingTask extends React.Component {
  state = {
    timeRemaining: taskEvaluationTime,
    hasBid: false,
  };

  componentWillUnmount = () => {
    clearInterval(this.forceUpdateInterval);
  };

  componentDidMount = () => {
    this.forceUpdateInterval = setInterval(() => this.tick(), 25);
  };

  tick = () => {
    const now = Date.now();
    const timeRemaining = this.props.startedTime + taskEvaluationTime - now;

    if (timeRemaining  > 0) {
      this.setState({
        timeRemaining: timeRemaining
      });
    } else {
      this.props.onTimeOut();
    }
  };

  handleBidClick = (e) => {
    this.props.onBidClick(this.props.id, e.target.dataset.bid);
    this.setState({
      hasBid: true
    });
  };

  render() {
    let mainEl;
    if (!this.state.hasBid) {
      mainEl = (
        <div className='buttons bids'>
          <button className="ui button" data-bid='0' onClick={this.handleBidClick}>0</button>
          <button className="ui button" data-bid='1' onClick={this.handleBidClick}>1</button>
          <button className="ui button" data-bid='2' onClick={this.handleBidClick}>2</button>
          <button className="ui button" data-bid='3' onClick={this.handleBidClick}>3</button>
          <button className="ui button" data-bid='5' onClick={this.handleBidClick}>5</button>
          <button className="ui button" data-bid='8' onClick={this.handleBidClick}>8</button>
          <button className="ui button" data-bid='13' onClick={this.handleBidClick}>13</button>
          <button className="ui button" data-bid='21' onClick={this.handleBidClick}>21</button>
        </div>
      );
    } else {
      mainEl = (
        <div>
          # o bids {this.props.bids.length}
        </div>
      );
    }

    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='header'>
            {this.props.title}
          </div>
          <div className='meta'>
            {this.props.subtitle}
          </div>
          {mainEl}
        </div>
        <div>
          <progress
            value={this.state.timeRemaining}
            max={taskEvaluationTime}
          ></progress>
        </div>
      </div>
    );
  };
};

class EvaluatedTask extends React.Component {
  handleDeleteClick = () => {
    this.props.onDeleteClick(this.props.id);
  }

  render() {
    const bids = this.props.bids.map((bid) => (
      <div className='ui item' key={uuid.v4()}>
        <div className="ui label">
          <span>{bid.bidder}</span> {bid.bid}
        </div>
      </div>
    ));

    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='header'>
            {this.props.title}
          </div>
          <div className='meta'>
            {this.props.subtitle}
          </div>
          <div className='ui horizontal list'>
            {bids}
          </div>

          <div className='extra content'>
            <span
              className='right floated edit icon'
              onClick={this.props.onRedoClick}
            >
              <i className='undo icon' />
            </span>
            <span
              className='right floated trash icon'
              onClick={this.handleDeleteClick}
            >
              <i className='trash icon' />
            </span>
          </div>
        </div>
      </div>
    );
  };
};

ReactDOM.render(
  <TaskDashboard />,
  document.getElementById('content')
);
