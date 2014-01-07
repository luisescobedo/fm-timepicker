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
                 input.push( +time );
               }
               return input;
             };
           } )

  .controller( "fmTimepickerController", function( $scope ) {
                 if( null == $scope.isOpen ) {
                   $scope.isOpen = false;
                 }
                 if( null == $scope.startTime ) {
                   $scope.startTime = moment( "00:00", "HH:mm" );
                 }
                 if( null == $scope.endTime ) {
                   $scope.endTime = moment( "23:59:59", "HH:mm:ss" );
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

                 $scope.ensureModelIsWithinBounds = function() {
                   // Constrain model value to be in given bounds.
                   if( $scope.ngModel.isBefore( $scope.startTime ) ) {
                     $scope.ngModel = moment( $scope.startTime );
                   }
                   if( $scope.ngModel.isAfter( $scope.endTime ) ) {
                     $scope.ngModel = moment( $scope.endTime );
                   }
                 };
                 $scope.ensureModelIsWithinBounds();

                 // Calculate a larger step value for the given step.
                 // This allows us to use the value for when we want to
                 // increase or decrease the model in larger increments.
                 $scope.$watch( "step", function( newStep, oldStep ) {
                   if( newStep.asMilliseconds() < 1 ) {
                     console.error( "fm-timepicker: Supplied step length is smaller than 1ms! Reverting to default." );
                     $scope.step = moment( 30, "minutes" );
                   }
                   $scope.largeStep = moment.duration( newStep.asMilliseconds() * 5 );
                 } )
               } )

  .directive( "fmTimepickerToggle", function() {
                return {
                  restrict : "A",
                  link     : function postLink( scope, element, attributes ) {
                    // Toggle the popup when the toggle button is clicked.
                    element.bind( "click", function() {
                      scope.togglePopup();
                    } );
                    // Hide the popup when we lose focus.
                    element.bind( "blur", function() {
                      scope.closePopup();
                    } );
                  }
                }
              } )

  .directive( "fmTimepicker", [
    "$timeout", function( $timeout ) {
      return {
        template   : "<div>" +
                     "  <div class='input-group'>" +
                     "    <input type='text' class='form-control' value=\"{{ngModel|fmTimeFormat:'HH:mm'}}\" ng-keyup='handleKeyboardInput($event)'>" +
                     "    <span class='input-group-btn'>" +
                     "      <button type='button' class='btn btn-default' fm-timepicker-toggle>" +
                     "        <span class='glyphicon glyphicon-time'></span>" +
                     "      </button>" +
                     "    </span>" +
                     "  </div>" +
                     "  <div class='dropdown' ng-class='{open:isOpen}'>" +
                     "    <ul class='dropdown-menu form-control' style='height:auto; max-height:160px; overflow-y:scroll;'>" +
                     "      <li ng-repeat='time in [] | fmTimeStep:startTime:endTime:step' ng-click='select(time)' ng-class='{active:isActive(time)}'><a href='#'>{{time|fmTimeFormat:'HH:mm'}}</a></li>" +
                     "    </ul>" +
                     "  </div>" +
                     "</div>",
        replace    : true,
        restrict   : "E",
        scope      : {
          ngModel   : "=",
          startTime : "=?",
          endTime   : "=?",
          step      : "=?",
          isOpen    : "=?"
        },
        controller : "fmTimepickerController",
        require    : "ngModel",
        link       : function postLink( scope, element, attributes ) {
          var inputElement = element.find( "input" );

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

          // --------------- Scope methods ---------------

          /**
           * Toggle the visibility of the popup.
           */
          scope.togglePopup = function() {
            scope.isOpen = !scope.isOpen;
            ensureUpdatedView();
          };

          /**
           * Open the popup.
           */
          scope.openPopup = function() {
            scope.isOpen = true;
            ensureUpdatedView();
          };

          /**
           * Close the popup.
           */
          scope.closePopup = function() {
            // Delay closing the popup by 200ms to ensure selection of
            // list items can happen before the popup is hidden.
            $timeout(
              function() {
                scope.isOpen = false;
              }
              , 200 );
            ensureUpdatedView();
          };

          /**
           * Selects a given timestamp as the new value of the timepicker.
           * @param {Number} timestamp UNIX timestamp
           */
          scope.select = function( timestamp ) {
            var time = moment( timestamp );
            scope.ngModel = time;
            scope.closePopup();
            $(inputElement).blur();
          };

          /**
           * Determines whether a given timestamp in the list is currently the selected one.
           * @param {Number} timestamp UNIX timestamp
           */
          scope.isActive = function( timestamp ) {
            return moment( timestamp ).isSame( scope.ngModel );
          };

          scope.handleKeyboardInput = function( event ) {
            switch( event.keyCode ) {
              case 13:
                // Enter
                scope.togglePopup();
                break;
              case 27:
                // Escape
                scope.closePopup();
                break;
              case 33:
                // Page up
                scope.ngModel.subtract( scope.largeStep );
                scope.ensureModelIsWithinBounds();
                break;
              case 34:
                // Page down
                scope.ngModel.add( scope.largeStep );
                scope.ensureModelIsWithinBounds();
                break;
              case 38:
                // Up arrow
                scope.ngModel.subtract( scope.step );
                scope.ensureModelIsWithinBounds();
                break;
              case 40:
                // Down arrow
                scope.ngModel.add( scope.step );
                scope.ensureModelIsWithinBounds();
                break;
              default:
            }
            ensureUpdatedView();
          };

          inputElement.bind( "focus", scope.openPopup );
          inputElement.bind( "blur", scope.closePopup );

          var popupListElement = element.find( "ul" );
          popupListElement.bind( "mousedown", function(event){
            event.preventDefault();
          } );
        }
      }
    }
  ] );