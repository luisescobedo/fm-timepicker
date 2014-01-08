/**
 * Copyright (C) 2014, HARTWIG Communication & Events
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * Created: 2014-01-07 15:49
 *
 * @author Oliver Salzburg
 * @copyright Copyright (C) 2014, HARTWIG Communication & Events
 * @license http://opensource.org/licenses/mit-license.php MIT License
 */

"use strict";

angular.module( "fm.components", [] )
  .filter( "fmTimeFormat", function() {
             return function( input, format ) {
               if( typeof input === "number" ) {
                 input = moment( input );
               }
               return moment( input ).format( format );
             }
           } )

  .filter( "fmTimeStep", function() {
             return function( input, start, end, step ) {
               if( null == start || null == end ) {
                 return input;
               }

               start = moment( start );
               end = moment( end );
               step = step || moment.duration( 30, "minutes" );

               for( var time = start.clone(); +time <= +end; time.add( step ) ) {
                 // We're using the UNIX offset integer value here.
                 // When trying to return the actual moment instance (and then later format it through a filter),
                 // you will get an infinite digest loop, because the returned objects in the resulting array
                 // will always be new, unique instances. We always need to return the identical, literal values for each input.
                 input.push( +time );
               }
               return input;
             };
           } )

  .controller( "fmTimepickerController", function( $scope ) {
                 if( null == $scope.isOpen ) {
                   $scope.isOpen = false;
                 }
                 if( null == $scope.format ) {
                   $scope.format = "HH:mm";
                 }
                 if( null == $scope.startTime ) {
                   $scope.startTime = moment.startOf( "day" );
                 }
                 if( null == $scope.endTime ) {
                   $scope.endTime = moment.endOf( "day" );
                 }
                 if( null == $scope.step ) {
                   $scope.step = moment.duration( 30, "minutes" );
                 }

                 // Round the model value up to the next valid time that fits the configured steps.
                 var modelMilliseconds = $scope.ngModel.valueOf();
                 var stepMilliseconds = $scope.step.asMilliseconds();

                 modelMilliseconds -= modelMilliseconds % stepMilliseconds;
                 modelMilliseconds += stepMilliseconds;

                 $scope.ngModel = moment( modelMilliseconds );

                 $scope.ensureTimeIsWithinBounds = function( time ) {
                   // Constrain model value to be in given bounds.
                   if( time.isBefore( $scope.startTime ) ) {
                     return moment( $scope.startTime );
                   }
                   if( time.isAfter( $scope.endTime ) ) {
                     return moment( $scope.endTime );
                   }
                   return time;
                 };
                 $scope.ngModel = $scope.ensureTimeIsWithinBounds( $scope.ngModel );

                 $scope.isValueWithinBounds = function( value ) {
                   return ( !$scope.ngModel.isBefore( $scope.startTime ) ) && ( !$scope.ngModel.isAfter( $scope.endTime ) );
                 };

                 // Calculate a larger step value for the given step.
                 // This allows us to use the value for when we want to
                 // increase or decrease the model in larger increments.
                 $scope.$watch( "step", function( newStep, oldStep ) {
                   if( newStep.asMilliseconds() < 1 ) {
                     console.error( "fm-timepicker: Supplied step length is smaller than 1ms! Reverting to default." );
                     $scope.step = moment.duration( 30, "minutes" );
                   }
                   $scope.largeStep = moment.duration( newStep.asMilliseconds() * 5 );
                 } );
               } )

  .directive( "fmTimepicker", [
    "$timeout", function( $timeout ) {
      return {
        template   : "<div>" +
                     "  <div class='input-group'>" +
                     "    <input type='text' class='form-control' ng-model='time' ng-keyup='handleKeyboardInput($event)' ng-change='update()'>" +
                     "    <span class='input-group-btn'>" +
                     "      <button type='button' class='btn btn-default' ng-class='{active:isOpen}'>" +
                     "        <span class='glyphicon glyphicon-time'></span>" +
                     "      </button>" +
                     "    </span>" +
                     "  </div>" +

                     "  <div class='modal-content'>" +
                     "    <div class='spinner-popup modal-body' style='position:relative;'>" +
                     "      <div class='row'>" +

                     "        <div class='col-xs-4 text-center'>" +
                     "          <button class='btn btn-default'>" +
                     "            <span class='glyphicon glyphicon-chevron-up'>" +
                     "          </button>" +
                     "          <input type='text' class='form-control'>" +
                     "          <button class='btn btn-default'>" +
                     "            <span class='glyphicon glyphicon-chevron-down'>" +
                     "          </button>" +
                     "        </div>" +

                     "        <div class='col-xs-4 text-center'>" +
                     "          <button class='btn btn-default'>" +
                     "            <span class='glyphicon glyphicon-chevron-up'>" +
                     "          </button>" +
                     "          <input type='text' class='form-control'>" +
                     "          <button class='btn btn-default'>" +
                     "            <span class='glyphicon glyphicon-chevron-down'>" +
                     "          </button>" +
                     "        </div>" +

                     "        <div class='col-xs-4 text-center'>" +
                     "          <button class='btn btn-default'>" +
                     "            <span class='glyphicon glyphicon-chevron-up'>" +
                     "          </button>" +
                     "          <input type='text' class='form-control'>" +
                     "          <button class='btn btn-default'>" +
                     "            <span class='glyphicon glyphicon-chevron-down'>" +
                     "          </button>" +
                     "        </div>" +

                     "      </div>" +
                     "    </div>" +
                     "  </div>" +

                     "  <div class='dropdown' ng-class='{open:isOpen}'>" +
                     "    <ul class='dropdown-menu form-control' style='height:auto; max-height:160px; overflow-y:scroll;'>" +
                     "      <li ng-repeat='time in [] | fmTimeStep:startTime:endTime:step' ng-click='select(time)' ng-class='{active:isActive(time)}'><a href='#' ng-click='preventDefault($event)'>{{time|fmTimeFormat:format}}</a></li>" +
                     "    </ul>" +
                     "  </div>" +
                     "</div>",
        replace    : true,
        restrict   : "E",
        scope      : {
          ngModel   : "=",
          format    : "=?",
          startTime : "=?",
          endTime   : "=?",
          step      : "=?",
          isOpen    : "=?"
        },
        controller : "fmTimepickerController",
        require    : "ngModel",
        link       : function postLink( scope, element, attributes, controller ) {
          // Watch our input parameters and re-validate our view when they change.
          scope.$watchCollection( "[startTime,endTime,step]", function() {
            validateView();
          } );

          /**
           * Invoked when we need to update the view due to a changed model value.
           */
          controller.$render = function() {
            // Convert the moment instance we got to a string in our desired format.
            var time = moment( controller.$modelValue ).format( scope.format );
            // Check if the given time is valid.
            var timeValid = checkTimeValueValid( time ) && checkTimeValueWithinBounds( time ) && checkTimeValueFitsStep( time );

            if( timeValid ) {
              // If the time is valid, store the time string in the scope used by the input box.
              scope.time = time;
            } else {
              throw new Error( "The provided time value is invalid." );
            }
          };

          /**
           * Reset the validity of the directive.
           * @param {Boolean} to What to set the validity to?
           */
          function resetValidity( to ) {
            controller.$setValidity( "time", to );
            controller.$setValidity( "bounds", to );
            controller.$setValidity( "step", to );
          }

          /**
           * Check if the value in the view is valid.
           * It has to represent a valid time in itself and it has to fit within the constraints defined through our input parameters.
           */
          function validateView() {
            resetValidity( true );
            // Check if the string in the input box represents a valid date according to the rules set through parameters in our scope.
            var timeValid = checkTimeValueValid( scope.time ) && checkTimeValueWithinBounds( scope.time ) && checkTimeValueFitsStep( scope.time );
            if( timeValid ) {
              // If the string is valid, convert it to a moment instance, store in the model and...
              controller.$setViewValue( moment( scope.time, scope.format ) );
              // ...convert it back to a string in our desired format.
              // This allows the user to input any partial format that moment accepts and we'll convert it to the format we expect.
              scope.time = moment( scope.time, scope.format ).format( scope.format );
            }
          }

          /**
           * Check if a given string represents a valid time in our expected format.
           * @param {String} timeString The timestamp is the expected format.
           * @returns {boolean} true if the string is a valid time; false otherwise.
           */
          function checkTimeValueValid( timeString ) {
            var time = timeString ? moment( timeString, scope.format ) : moment.invalid();
            if( !time.isValid() ) {
              controller.$setValidity( "time", false );
              controller.$setViewValue( null );
              return false;
            } else {
              controller.$setValidity( "time", true );
              return true;
            }
          }

          /**
           * Check if a given string represents a time within the bounds specified through our start and end times.
           * @param {String} timeString The timestamp is the expected format.
           * @returns {boolean} true if the string represents a valid time and the time is within the defined bounds; false otherwise.
           */
          function checkTimeValueWithinBounds( timeString ) {
            var time = timeString ? moment( timeString, scope.format ) : moment.invalid();
            if( !time.isValid() || time.isBefore( scope.startTime ) || time.isAfter( scope.endTime ) ) {
              controller.$setValidity( "bounds", false );
              controller.$setViewValue( null );
              return false;
            } else {
              controller.$setValidity( "bounds", true );
              return true;
            }
          }

          /**
           * Check if a given string represents a time that lies on a the boundary of a time step.
           * @param {String} timeString The timestamp in the expected format.
           * @returns {boolean} true if the string represents a valid time and that time lies on a time step boundary; false otherwise.
           */
          function checkTimeValueFitsStep( timeString ) {
            var time = timeString ? moment( timeString, scope.format ) : moment.invalid();
            // Check first if the time string could be parsed as a valid timestamp.
            var isValid = time.isValid();
            if( isValid ) {
              // Calculate the amount of milliseconds that passed since the specified start time.
              var durationSinceStartTime = time.diff( scope.startTime );
              // Calculate how many milliseconds are within the given time step.
              var stepMilliseconds = scope.step.asMilliseconds();
              // Check if the modulo operation has a remainder.
              isValid = ( 0 == ( durationSinceStartTime % stepMilliseconds ) );
            }

            if( !isValid ) {
              controller.$setValidity( "step", false );
              controller.$setViewValue( null );
              return false;
            } else {
              controller.$setValidity( "step", true );
              return true;
            }
          }

          function ensureUpdatedView() {
            scope.$root.$$phase || scope.$apply();

            // Scroll the selected list item into view if the popup is open.
            if( scope.isOpen ) {
              // Use $timeout to give the DOM time to catch up.
              $timeout( function() {
                scrollSelectedItemIntoView();
              } );
            }
          }

          /**
           * Scroll the time that is currently selected into view.
           * This applies to the dropdown below the input element.
           */
          function scrollSelectedItemIntoView() {
            // Find the popup.
            var popupListElement = element.find( "ul" );
            // Scroll it to the top, so that we can then get the correct relative offset for all list items.
            $( popupListElement ).scrollTop( 0 );
            // Find the selected list item.
            var selectedListElement = $( "li.active", popupListElement );
            // Retrieve offset from the top and height of the list element.
            var top = selectedListElement.length ? selectedListElement.position().top : 0;
            var height = selectedListElement.length ? selectedListElement.outerHeight( true ) : 0;
            // Scroll the list to bring the selected list element into the view.
            $( popupListElement ).scrollTop( top - height );
          }

          /**
           * Open the popup dropdown list.
           */
          function openPopup() {
            if( !scope.isOpen ) {
              scope.isOpen = true;
              scope.modelPreview = scope.ngModel ? scope.ngModel.clone() : scope.startTime.clone();
              ensureUpdatedView();
            }
          }

          /**
           * Close the popup dropdown list.
           */
          function closePopup( delayed ) {
            if( delayed ) {
              // Delay closing the popup by 200ms to ensure selection of
              // list items can happen before the popup is hidden.
              $timeout(
                function() {
                  scope.isOpen = false;
                }
                , 200 );
            } else {
              scope.isOpen = false;
              ensureUpdatedView();
            }
          }

          // --------------- Scope methods ---------------

          /**
           * Selects a given timestamp as the new value of the timepicker.
           * @param {Number} timestamp UNIX timestamp
           */
          scope.select = function( timestamp ) {
            var time = moment( timestamp );
            scope.time = time.format( scope.format );
            scope.update();
            closePopup();
          };

          /**
           * Check if the value in the input control is a valid timestamp.
           */
          scope.update = function() {
            var timeValid = checkTimeValueValid( scope.time ) && checkTimeValueWithinBounds( scope.time );
            if( timeValid ) {
              controller.$setViewValue( moment( scope.time, scope.format ) );
            }
          };

          /**
           * Determines whether a given timestamp in the list is currently the selected one.
           * @param {Number} timestamp UNIX timestamp
           */
          scope.isActive = function( timestamp ) {
            return moment( timestamp ).isSame( scope.modelPreview );
          };

          scope.handleKeyboardInput = function( event ) {
            switch( event.keyCode ) {
              case 13:
                // Enter
                if( scope.modelPreview ) {
                  scope.ngModel = scope.modelPreview;
                  scope.isOpen = false;
                }
                break;
              case 27:
                // Escape
                closePopup();
                break;
              case 33:
                // Page up
                scope.modelPreview.subtract( scope.largeStep );
                scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
                break;
              case 34:
                // Page down
                scope.modelPreview.add( scope.largeStep );
                scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
                break;
              case 38:
                // Up arrow
                openPopup();
                scope.modelPreview.subtract( scope.step );
                scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
                break;
              case 40:
                // Down arrow
                openPopup();
                scope.modelPreview.add( scope.step );
                scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
                break;
              default:
            }
            ensureUpdatedView();
          };

          /**
           * Prevent default behavior from happening.
           * @param event
           */
          scope.preventDefault = function( event ) {
            event.preventDefault();
          };

          var inputElement = element.find( "input" );
          var toggleButtonElement = element.find( "button" );
          var popupListElement = element.find( "ul" );

          /**
           * Open the popup when the input box gets focus.
           */
          inputElement.bind( "focus", function() {
            openPopup();
          } );

          /**
           * Invoked when the input box loses focus.
           */
          inputElement.bind( "blur", function() {
            // Delay any action by 150ms
            $timeout( function() {
              // Check if we didn't get refocused in the meantime.
              // This can happen if the input box is selected and the user toggles the dropdown.
              // This would cause a hide and close in rapid succession, so don't do it.
              if( !$( inputElement ).is( ":focus" ) ) {
                closePopup();
                validateView();
              }
            }, 150 );
          } );

          /**
           * Define the behavior of the dropdown toggle button.
           */
          toggleButtonElement.bind( "click", function() {
            if( scope.isOpen ) {
              $( inputElement ).focus();
              closePopup();
            } else {
              // Focusing the input element will automatically open the popup
              $( inputElement ).focus();
            }
          } );

          popupListElement.bind( "mousedown", function( event ) {
            event.preventDefault();
          } );
        }
      }
    }
  ] );