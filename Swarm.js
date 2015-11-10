/*Swarm class description:

	For each child (swarm or particle):
	update child positions O(children)
	this.position = weightedmean(children) O(children)


	calculate child accelerations (due to other sibling swarms) O((swarms + children) * children)
	this.accel = weightedmean(children) O(children)

	this.radiusOfInfluenceUpdate
		Maximum distance of object of lesser mass bound to it?

	membershipUpdate
		if child becoming unbound, promote to member of parent\s swarm.
		if child is only member of swarm, promote to member of parent''s swarm, 
		if I am gravitationally bound to several objects, and I am the most massive of the set, I might be the sun.
		Well, if any of my children

		Each object nominates objects for parenthood:
		  If we are bound, I consider you a relative.
		  If we are bound, and you are my immediate superior in mass, I nominate you as a parent.
		  If an object reaches n such nominations, It will start a it''s own swarm, with itself as the largest member
          


	update child velocities O(children)
	this.velocity = weightedmean(children) O(children)





TheSwarm = Swarm(solar system objects)

Example

sun
Jupiter + 15 moons
Saturn + 4 moons

22 particles, for ~484 pairings  (N^2 - N)/2 is the correct number. 231 pairings for reals

Sun doesn''t nominate anyone.
Jupiter nominates sun.
Saturn nominates sun.
Sun is leader of a swarm with all particles bound to it.

Jupiter is nominated 15 times by its moons.
Jupiter-led swarm starts, with 16 members, all of whom are demoted from Sun''s swarm to Jupiter''s.
Total mass is jupiter+satellites'' masses.

Let''s have saturn also do so.
New swarm with 5 members.

Now: Sun has two children: the Jupiter and Saturn Swarms.
Positions update issued from TheSwarm
Jupiter:update!
->Moons:Update!
->Jupiter:Update!
->JupiterSwarm:update!
Same for Saturn.
20 + 3 ish updates bubble down and back up again.


Acceleration calculation:

Almost lossless:
JupiterSwarm sees 16*15/2 pairings, plus 16 Child x 2 Swarm interactions. 120+32 = 152 reals.
SaturnSwarm sees 5^2 pairings, plus 5 Child x 2 Swarm interactions. 10+10 = 20 reals.
Sun sees 2 pairings. 2 reals
174 reals.
Not much savings.


Very lossy:
JupiterSwarm sees 16 pairings, plus one swarm x 2 swarm interactions. 18 
Saturn sees 5, plus one swarm x 2 swarm interactions. 7
Sun sees 2.
27 reals.
Enormous savings.
*/








