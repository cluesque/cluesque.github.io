/*global $, Pusher, setInterval, clearInterval */

(function() {

window.BigNumber = {
  // Parameters controlling animation
  tau: 10000,          // Time constant on approaching correctness
  minInterval: 100,    // Minimum interval (msec) between updates
  maxInterval: 440,    // Maximum interval (msec) between updates
  minTick: 1,          // Minimum update amount

  init: function(element, key, stream, theEvent, opts) {
    BigNumber.element = element;
    BigNumber.currentInterval = BigNumber.minInterval;
    if (opts) {
      $.extend(BigNumber, opts);
    }

    BigNumber.element.removeClass('empty');

    // BigNumber.subscribeToPusherStream(key, stream, theEvent);
    // BigNumber.loadInitialAmount();
  },

  subscribeToPusherStream: function(key, stream, theEvent) {
    new Pusher(key).subscribe(stream).bind(theEvent, BigNumber.update);
  },

  loadInitialAmount: function() {
    $.getJSON('https://secure.actblue.com/metrics/bignumber', this.handleInitialAmount);
    // this.spinIndefinitely();
  },

  handleInitialAmount: function(data) {
console.log('handleInitialAmount: ');
console.log(data);
    var raisedAmount = data.sitewide_raised_amount;
    if (typeof raisedAmount === 'string') {
      raisedAmount = parseInt(raisedAmount.replace(/,/g, ''), 10);
    }
    BigNumber.targetAmount = raisedAmount;
    BigNumber.displayedAmount = BigNumber.targetAmount;

    BigNumber.stopIndefiniteSpin();
    BigNumber.displayAmount(BigNumber.displayedAmount);
  },

  spinIndefinitely: function() {
    BigNumber.spinId = setInterval(function() {
      var randomNumber = '';
      for (var i=0; i < 9; i++) {
        randomNumber += Math.floor(Math.random() * 10);
      }
      BigNumber.displayAmount(randomNumber);
    }, 33);
  },

  stopIndefiniteSpin: function() {
    clearInterval(BigNumber.spinId);
  },

  displayAmount: function(amount) {
    BigNumber.element.text(BigNumber.commify(amount));
    if (BigNumber.callback) {
      BigNumber.callback(amount);
    }
  },

  commify: function(num) {
    return num.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
  },

  defined: function(variable) { return typeof variable !== 'undefined'; },

  toDollars: function(amountInCents) {
    return parseInt(parseFloat(amountInCents) / 100, 10);
  },

  skew: function() {
    return BigNumber.targetAmount - BigNumber.displayedAmount;
  },

  update: function(data) {
    BigNumber.targetAmount = BigNumber.toDollars(data.total);
    if (BigNumber.onUpdate) {
      BigNumber.onUpdate(data);
    }
    return BigNumber.startAnimation();
  },

  adjustAnimation: function(interval) {
    if(interval != BigNumber.currentInterval) {
      clearInterval(BigNumber.intervalId);
      BigNumber.currentInterval = interval;
      BigNumber.intervalId = setInterval(BigNumber.animate, BigNumber.currentInterval);
    }
  },

  startAnimation: function() {
    if(!BigNumber.defined(BigNumber.intervalId) || BigNumber.intervalId === null) {
      BigNumber.intervalId = setInterval(BigNumber.animate, BigNumber.currentInterval);
    }
    return BigNumber;
  },

  stopAnimation: function() {
    clearInterval(BigNumber.intervalId);
    BigNumber.intervalId = null;
    return BigNumber;
  },

  animate: function() {
    if (BigNumber.displayedAmount >= BigNumber.targetAmount) {
      BigNumber.stopAnimation();
    } else {
      var tick, interval, skew = BigNumber.skew();
      if (skew < BigNumber.tau / BigNumber.maxInterval) {
        tick = BigNumber.minTick;
        interval = BigNumber.maxInterval;
      } else if (skew < BigNumber.tau / BigNumber.minInterval) {
        tick = BigNumber.minTick;
        interval = Math.ceil(BigNumber.tau / skew);
      } else {
        interval = BigNumber.minInterval;
        tick = Math.ceil(skew * BigNumber.minInterval / BigNumber.tau);
      }
      BigNumber.adjustAnimation(interval);
      BigNumber.displayedAmount += tick;
      BigNumber.displayAmount(BigNumber.displayedAmount);
    }
  }
};

})();
