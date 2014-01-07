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

               for( var time = start.clone(); +time < +end; time.add( step ) ) {
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
                     "    <input type='text' class='form-control' value=\"{{ngModel|fmTimeFormat:'HH:mm'}}\">" +
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
          };

          /**
           * Determines whether a given timestamp in the list is currently the selected one.
           * @param {Number} timestamp UNIC timestamp
           */
          scope.isActive = function( timestamp ) {
            return moment( timestamp ).isSame( scope.ngModel );
          };
          inputElement.bind( "focus", scope.openPopup );
          inputElement.bind( "blur", scope.closePopup );
        }
      }
    }
  ] );