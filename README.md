# Ratatooey

This is a simple bot for creating a Secret-Santa-style rotation in a Discord server. It has 3 modes:

- **Random**: Everyone who joins a rotation is given the name of another user, but does not know who anyone else has received. This is a fully random selection.
- **Manual**: Everyone sees all the names of people who have not been selected yet, and can choose one of them (but not themselves). Again, they cannot see who anyone else has selected. **(NOT IMPLEMENTED YET)**
- ✨**Auto-Magic**✨: Similar to Automatic, but uses the past history of all members in the rotation to have the lowest rate of repeating sender-receiver pairs. For example, let's say you've been in several prior secret santas with 2 members: "Breebo Braggins" and "Gwanyalf the Gwuwu", and you've gotten Breebo as the recipient 3 times and never once gotten Gwanyalf. The Auto-magic process will prefer to give you Gwanyalf over Breebo. However, it considers the best selection for ALL rotation members collectively, so it's still possible to get Breebo if for example Breebo has gotten you 5 times and Gwayyalf has gotten Breebo 8 times. Due to technical limitations, this selection process is limited to 8 members.

## Commands

### New Rotation

`/new_rotation Random|Manual|Magic`

This generates an open rotation on the channel, which will have 3 options (in this example, I used `/new_rotation Random`):
![alt text](images/new-rotation.png)

- `Join` - Join this rotation as a member (limited to 8 members for Magic rotations). Any member of the server can join.
- `Start` - This ends the pending status of the rotation, which effectively "finishes" it. Either the Admin or the initiator of the rotation can start it.
- `Delete` - Delete the pending rotation. Either the Admin or the initiator of the rotation can start it.

If there is already a pending (unstarted) rotation on the server, this command will fail. The pending rotation will either need to be started or deleted first before a new one can be created.

#### Started Rotations

A rotation that has started will change to this form:
![alt text](images/started-rotation.png)

This has a `Reveal` action that, if used by a user in the rotation, will provide them with their recipient in an ephemeral message (can only be seen by them):
![alt text](images/join-rotation.png)

### Delete Rotation

`/delete_rotation`

Deletes the pending (unstarted) rotation if one exists on the server. Even though the rotation widget has a "Delete" button, this extra command is provided as a convenience.

Like with the message action, the delete command can only be run by an admin or the user that initiated the rotation.

### Show Rotation

`/show_rotation`

If there is a pending (unstarted) rotation on the server, there _should_ be a widget that allows it to be joined, started, or deleted. However, since this widget is a Discord message, it's possible to delete this message. To prevent a soft-lock of the bot state, this command will recreate the widget message in the server. If the original message hasn't been deleted, this command will delete it before recreating the new message.

This command can be run by any member.

### Reveal All

`/reveal_all`

Reveals the full list of sender/receiver pairs for the last started rotation. It does so in an ephemeral message (which can only be seen by the person who calls it).

![alt text](images/reveal-all.png)

This can only be run by an admin. If the initiator is not an admin, they will not be able to run this command.

## Reason for Auto-Magic limitation:

The time-complexity of my implementation of this is factorial because it considers all possible derangements of the list of members, then finds the one with the lowest score, which is a simple calculation of the sum of the occurances of all past sender-receiver pairs within a given selection. Since derangements grow factorially, this function gets very naughty _very quickly_. On my not-so-bad PC, this equates to a time of ~600ms for 10 members. I don't like that at all, so for the greatest chance of keeping things slim, I'm ensuring that no Auto-Magic rotation has more than 8 members.

The truth, however, is that I'm 100% positive that there's a better way to calculate the best derangement without brute force, I just couldn't figure it out quickly enough and wanted to get this bot off the ground. Also, the server I want to use this in only has 7 members at the moment, so this definitely isn't an issue yet.

