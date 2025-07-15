import {Badge, Card, Col, Row, Table} from "react-bootstrap";
import {getImageByName} from "../../utils/getImage.js";


function MenuSections({list, header, renderItem, mdStyle}) {
    return (
        <section>
            <h2 className="mb-3">{header}</h2>
            <Row xs={1} sm={2} md={mdStyle} className="g-3">
                {list.map((el, index) => (
                    <Col key={el.name || index}>
                        {renderItem(el)}
                    </Col>
                ))}
            </Row>
        </section>
    );
}

function IncompatibilityAndDependencySection({list, header, renderItem}) {
    return (
        <section>
            <h2 className="mb-3 text-center">{header}</h2>
            <Row xs={1} sm={2} md={1}
                 className="g-3 justify-content-center align-content-center text-center">
                {list.map((pair, index) => (
                    <Col key={pair.ingredient1 + index}>
                        {renderItem(pair)}
                    </Col>
                ))}
            </Row>
        </section>
    );
}

function DishCard({dish}) {

    return (
        <Card className="mb-3 shadow" style={{minHeight: '100%'}}>
            <Row className="g-0">
                <Card.Img
                    src={getImageByName(dish.name) || null}
                    style={{height: '150px', width: '100%', objectFit: 'cover'}}
                />
                <Card.Body>
                    <Card.Title>{dish.name}</Card.Title>

                    <span> <Card.Text>{dish.description}</Card.Text></span>
                </Card.Body>
            </Row>
        </Card>
    )
        ;
}

function SizeCard({size}) {
    return (
        <Card className="mb-3">
            <Card.Body>
                <Card.Title>
                    {size.name}{' '}
                    <Badge bg="secondary">{size.price.toFixed(2)}€</Badge>
                </Card.Title>
                max {size.maxIngredients} ingredients
            </Card.Body>
        </Card>
    );
}


function IngredientCard({ingredient}) {
    return (
        <Card className="mb-3 justify-content-center" style={{width: '100%'}}>
            <Card.Body className="h-100">
                <Row className="ps-2 h-100 align-items-center">
                    <Col xs={4} className="d-flex justify-content-center">
                        <Card.Img
                            src={getImageByName(ingredient.name) || undefined}
                            className="rounded-3"
                            style={{height: '80px', width: '80px', objectFit: 'cover'}}
                        />
                    </Col>
                    <Col xs={8}>
                        <Card.Title className="mb-1">{ingredient.name}</Card.Title>
                        <Badge bg="secondary">{ingredient.price.toFixed(2)}€</Badge>
                        <div className="py-2" >
                            {
                                ingredient.unlimited ?
                                    <span className="text-secondary mx-1">Infinite Availability</span>
                                    :
                                    <span className="text-primary mx-1">Limited Availability</span>
                            }
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}


const isPlural = (word) => {
    return word.endsWith('s') && !word.endsWith('ss');
}

function MyIncompatibilityAndDependency({pair, task}) {

    const actionText = task === 'dependency'
        ? (isPlural(pair.ingredient1) ? 'require' : 'requires')
        : (isPlural(pair.ingredient1) ? 'are incompatible with' : 'is incompatible with');
    const colorClass = task === 'dependency' ? 'text-primary' : 'text-danger';

    return (
        <div
            className="rounded p-3 mb-3 bg-light shadow-sm"
        >
            <Row className="align-items-center text-center">
                <Col>
                    <span className="fs-5 ">
                        {pair.ingredient1}
                    </span>

                    <span className={`mx-2  ${colorClass}`}>
                        {actionText}
                    </span>

                    <span className="fs-5 ">
                        {pair.ingredient2}
                    </span>
                </Col>
            </Row>
        </div>
    );
}


export {
    MenuSections,
    IncompatibilityAndDependencySection,
    SizeCard,
    IngredientCard,
    DishCard,
    MyIncompatibilityAndDependency,
}