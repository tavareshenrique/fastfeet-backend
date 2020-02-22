import { Op } from 'sequelize';

import Deliverymen from '../models/Deliverymen';
import File from '../models/File';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Signature from '../models/Signature';

class DeliverymenController {
  async index(req, res) {
    const deliverymen = await Deliverymen.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(deliverymen);
  }

  async show(req, res) {
    const { id } = req.params;
    const { delivered } = req.query;

    const order = await Order.findAll({
      where: {
        deliveryman_id: id,
        canceled_at: null,
        end_date: delivered ? { [Op.ne]: null } : null,
      },
      attributes: ['id', 'product', 'start_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zipcode',
          ],
        },
        {
          model: Signature,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(order);
  }

  async store(req, res) {
    const { name, email } = await Deliverymen.create(req.body);

    return res.json({
      name,
      email,
    });
  }

  async update(req, res) {
    const { email } = req.body;
    const { id } = req.params;

    const deliveryman = await Deliverymen.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    if (email !== deliveryman.email) {
      const userExists = await Deliverymen.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'Deliveryman already exists.' });
      }
    }

    await deliveryman.update(req.body);

    const { name, avatar } = await Deliverymen.findByPk(id, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliverymen = await Deliverymen.findByPk(id);

    await deliverymen.destroy();

    return res.send();
  }
}

export default new DeliverymenController();
