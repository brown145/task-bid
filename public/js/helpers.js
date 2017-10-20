window.helpers = (function () {
  function newTask(attrs = {}) {
    const task = {
      id: uuid.v4(),
      title: attrs.title || 'Title',
      subtitle: attrs.subtitle || '',
      startedTime: null,
      bids: null,
    };

    return task;
  }
  return {
    newTask,
  };
}());
