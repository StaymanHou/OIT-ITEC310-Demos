class Player {
  constructor(id, options) {
    this.id = id;
    this.ign = options.ign;
    this.joinedAt = Date.now();
  }

  static equals(id1, id2) {
    return id1 && id2 && id1 === id2;
  }

  static compare(player1, player2) {
    return player1.joinedAt > player2.joinedAt;
  }

  toJSON() {
    return {
      id: this.id,
      ign: this.ign,
    };
  }
}

module.exports = Player;
