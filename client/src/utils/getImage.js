// src/utils/getImage.js
import pizza from '../assets/images/restaurant/pizza.png';
import pasta from '../assets/images/restaurant/pasta.png';
import salad from '../assets/images/restaurant/salad.png';
import mozzarella from '../assets/images/restaurant/mozzarella.png';
import ham from '../assets/images/restaurant/ham.png';
import eggs from '../assets/images/restaurant/egg.png';
import carrots from '../assets/images/restaurant/carrots.png';
import tomatoes from '../assets/images/restaurant/tomatoes.png';
import olives from '../assets/images/restaurant/olives.png';
import anchovies from '../assets/images/restaurant/anchovies.png';
import potatoes from '../assets/images/restaurant/potatoes.png';
import mushrooms from '../assets/images/restaurant/mushrooms.png';
import tuna from '../assets/images/restaurant/tuna.png';
import parmesan from '../assets/images/restaurant/parmesan.png';

const images = {
    pizza,
    pasta,
    salad,
    mozzarella,
    ham,
    eggs,
    carrots,
    tomatoes,
    olives,
    anchovies,
    potatoes,
    mushrooms,
    tuna,
    parmesan
};

export function getImageByName(name) {
    return images[name.toLowerCase()] || null;
}