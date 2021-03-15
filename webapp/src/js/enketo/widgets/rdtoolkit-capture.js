{
  'use strict';
  const Widget = require('enketo-core/src/js/Widget');
  const $ = require( 'jquery' );
  const moment = require('moment');
  require('enketo-core/src/js/plugins');

  const pluginName = 'rdtoolkitcapturewidget';

  /**
   * @constructor
   * @param {Element} element [description]
   * @param {(boolean|{touch: boolean, repeat: boolean})} options options
   */
  function Rdtoolkitcapturewidget(element, options) {
    this.namespace = pluginName;
    Widget.call(this, element, options);
    this._init();
  }

  // Copy the prototype functions from the Widget super class
  Rdtoolkitcapturewidget.prototype = Object.create(Widget.prototype);

  // Ensure the constructor is the new one
  Rdtoolkitcapturewidget.prototype.constructor = Rdtoolkitcapturewidget;

  Rdtoolkitcapturewidget.prototype.destroy = function(element) {};  // eslint-disable-line no-unused-vars

  Rdtoolkitcapturewidget.prototype._init = function() {
    const $widget = $(this.element);
    const rdToolkitService = window.CHTCore.RDToolkit;
    displayActions($widget);

    $widget.on('click', '.btn.rdtoolkit-capture-test', function() {
      const sessionId = getFieldValue('rdtoolkit_session_id');
      rdToolkitService
        .captureRDTest(sessionId)
        .then((response = {}) => {
          const capturedTest = {
            sessionId: response.sessionId || '',
            state: response.state || '',
            timeStarted: getDate(response.timeStarted),
            timeResolved: getDate(response.timeResolved),
            timeRead: getDate(response.timeRead),
            results: response.results || [],
            resultsDescription: getFormattedResult(response.results)
          };

          setFields($widget, capturedTest);
          hideActions($widget);
          displayPreview($widget, capturedTest);
        });
    });
  };

  function displayActions($widget) {
    window.CHTCore.Translate
      .get('rdtoolkit.capture')
      .toPromise()
      .then(label => {
        $widget
          .find('.or-appearance-patient_id')
          .after('<div class="rdtoolkit-preview"></div>')
          .after(`
            <div class="rdtoolkit-actions">
              <a class="btn btn-primary rdtoolkit-capture-test">${label}</a>
            </div>
          `);
      });
  }

  function hideActions($widget) {
    $widget
      .find('.rdtoolkit-actions')
      .hide();
  }

  function displayPreview($widget, capturedTest) {
    $widget
      .find('.rdtoolkit-preview')
      .append(`
        <div>
          ${window.CHTCore.Translate.instant('report.rdtoolkit_capture.rdtoolkit_preview_title')}
        </div>
        <br>
        <div>
          <span class="rdt-label">
            ${window.CHTCore.Translate.instant('report.rdtoolkit_capture.rdtoolkit_preview_results')} 
          </span>
          <span class="rdt-value">${capturedTest.resultsDescription}</span>
        </div>
        <div>
          <span class="rdt-label">
            ${window.CHTCore.Translate.instant('report.rdtoolkit_capture.rdtoolkit_preview_time_read')} 
          </span>
          <span class="rdt-value">${capturedTest.timeRead}</span>
        </div>
        <br>
        <div>
           ${window.CHTCore.Translate.instant('report.rdtoolkit_capture.rdtoolkit_preview_next_action')} 
        </div>
      `);
  }

  function setFields($widget, capturedTest) {
    // ToDo: set these values in the Enketo way by using: window.CHTCore.Enketo.getCurrentForm()
    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_session_id"]')
      .val(capturedTest.sessionId)
      .trigger('change');
    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_results"]')
      .val(JSON.stringify(capturedTest.results))
      .trigger('change');
    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_results_description"]')
      .val(capturedTest.resultsDescription)
      .trigger('change');
    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_time_read"]')
      .val(capturedTest.timeRead)
      .trigger('change');

    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_state"]')
      .val(capturedTest.state)
      .trigger('change');
    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_time_started"]')
      .val(capturedTest.timeStarted)
      .trigger('change');
    $widget
      .find('input[name="/rdtoolkit_capture/rdtoolkit_time_resolved"]')
      .val(capturedTest.timeResolved)
      .trigger('change');
  }

  function getDate(dateTime) {
    return dateTime && moment(dateTime).isValid() ? moment(dateTime).format('LLL'): '';
  }

  function getFieldValue(fieldName) {
    const form = window.CHTCore.Enketo.getCurrentForm();

    if (!form) {
      return;
    }

    return form.model.$.find(fieldName).text();
  }

  function getFormattedResult(results) {
    if (!results) {
      return '';
    }

    let description = '';

    results.forEach(item => {
      const test = window.CHTCore.Translate.instant(item.test);
      const result = window.CHTCore.Translate.instant(item.result);

      description += `${description ? ', ' : ''}${test || item.test}: ${result || item.result}`;
    });

    return description;
  }

  $.fn[pluginName] = function(options, event) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data(pluginName);

      options = options || {};

      if (!data && typeof options === 'object') {
        $this.data(pluginName, (data = new Rdtoolkitcapturewidget(this, options, event)));

      } else if (data && typeof options === 'string') {
        data[options](this);
      }
    });
  };

  module.exports = {
    'name': pluginName,
    'selector': '.or-appearance-rdtoolkit_capture',
  };

}
