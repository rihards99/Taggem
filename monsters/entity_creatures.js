var ROT = require("rot");
var utilities = require("../utilities");
var state = require("../state");
var listeners = require("../listeners");
var construct = require("../objects/entity_objects");

var creatures = {};
module.exports = creatures;

var importList = ["grid_bug", "nymph", "face_monster"];

var creatureProto = creatures.creatureProto = Object.create(construct.entityProto);
creatureProto.setHealth = function(healthDelta) {
    this.health += healthDelta;
    if(this.health <= 0) {
        listeners.output.emit("output", { message: "The " + this.name + " is destroyed!", visible:true, point:this });
        this.remove();
        listeners.change.emit("change", [this.z], ["pos"]);
    } else {
        if(healthDelta < 0 && this.onDamage) { this.onDamage(); }
    }
};

// greedily step toward target space
creatureProto.stepToward = function(target, isBlockingFunc) {
    // use Dijkstra's alg to find next step direction
    // this might someday be too expensive with more entities?
    var that = this;
        var passableCallback = utilities.passableOnLevel(state.entities, this.z, function(ent) {
            if((ent.x == target.x && ent.y == target.y) || (ent.x == that.x && ent.y == that.y)) {
                return false;
            }

            if(isBlockingFunc) { return isBlockingFunc(ent); }
            else { return ent.blocking; }
        });
    var dijkstra = new ROT.Path.Dijkstra(this.target.x, this.target.y, passableCallback);
    var that = this;
    var found = false;
    dijkstra.compute(this.x, this.y, function(x, y) {
        // first callback is the creature's location
        if(that.x == x && that.y == y) { return true; }
	
        // the second callback has the first step; use that and then mark it found
        if(!found) { that.step({ x: x - that.x, y: y - that.y }); found = true; }
        return false;
    });
    
    return found;
}
creatureProto.health = 1;
creatureProto.blocking = true;
creatureProto.forgettable = true;


for(var i=0; i<importList.length; ++i) {
    require("./" + importList[i]);
}

