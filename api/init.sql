CREATE DATABASE IF NOT EXISTS systeme_vote
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE systeme_vote;

CREATE TABLE utilisateur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE seance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(100) NOT NULL,
    fin_seance DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE siege (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    id_seance INT NOT NULL,
    place VARCHAR(50) NOT NULL,
    vote ENUM('oui', 'non', 'neutre') NOT NULL DEFAULT 'neutre',

    CONSTRAINT fk_siege_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_siege_seance
        FOREIGN KEY (id_seance)
        REFERENCES seance(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_seance_place UNIQUE (id_seance, place),
    CONSTRAINT uq_seance_utilisateur UNIQUE (id_seance, id_utilisateur)
) ENGINE=InnoDB;