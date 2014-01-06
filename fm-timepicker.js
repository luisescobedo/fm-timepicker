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
             return function( input, start, end ) {
               if( null == start || null == end ) return input;

               start = moment( start );
               end = moment( end );

               for( var time = start.clone(); +time < +end; time.add( "minutes", 30 ) ) {
                 input.push( +time );
               }
               return input;
             };
           } )

  .controller( "fmTimepickerController", function( $scope ) {
                 if( null == $scope.isOpen ) $scope.isOpen = false;
               } )

  .directive( "fmTimepickerToggle", function() {
                return {
                  restrict : "A",
                  link     : function postLink( scope, element, attributes ) {
                    element.bind( "click", function() {
                      scope.toggle();
                    } )
                  }
                }
              } )

  .directive( "fmTimepicker", function() {
                return {
                  template   : "<div>" +
                               "  <div class='input-group'>" +
                               "    <input type='text' class='form-control' value=\"{{ngModel|fmTimeFormat:'HH:mm'}}\"></input>" +
                               "    <span class='input-group-btn'>" +
                               "      <button type='button' class='btn btn-default' fm-timepicker-toggle>" +
                               "        <span class='glyphicon glyphicon-time'></span>" +
                               "      </button>" +
                               "    </span>" +
                               "  </div>" +
                               "  <div class='dropdown' ng-class='{open:isOpen}'>" +
                               "    <ul class='dropdown-menu form-control' style='height:auto; max-height:160px; overflow-y:scroll;'>" +
                               "      <li ng-repeat='time in [] | fmTimeStep:startTime:endTime' ng-click='select(time)'><a href='#'>{{time|fmTimeFormat:'HH:mm'}}</a></li>" +
                               "    </ul>" +
                               "  </div>" +
                               "</div>",
                  replace    : true,
                  restrict   : "E",
                  scope      : {
                    ngModel   : "=",
                    startTime : "=",
                    endTime   : "=",
                    isOpen    : "=?"
                  },
                  controller : "fmTimepickerController",
                  require    : "ng-model",
                  link       : function postLink( scope, element, attributes ) {
                    scope.toggle = function() {
                      scope.isOpen = !scope.isOpen;
                    }
                    scope.close = function() {
                      scope.isOpen = false;
                    }
                    scope.select = function( timestamp ) {
                      var time = moment( timestamp );
                      scope.ngModel = time;
                      scope.close();
                    }
                  }
                }
              } );