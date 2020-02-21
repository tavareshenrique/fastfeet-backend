import { parseISO, getHours } from 'date-fns';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliverymen from '../models/Deliverymen';
import Signature from '../models/Signature';

import Mail from '../../lib/Mail';

class OrderController {
  async index(req, res) {
    const order = await Order.findAll({
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['name'],
        },
        {
          model: Deliverymen,
          as: 'deliveryman',
          attributes: ['name', 'email'],
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
    const { recipient_id, deliveryman_id, product } = await Order.create(
      req.body
    );

    const { name: nameDeliveryman, email } = await Deliverymen.findByPk(
      deliveryman_id
    );
    const {
      name: nameRecipient,
      street,
      number,
      complement,
      state,
      city,
      zipcode,
    } = await Recipient.findByPk(recipient_id);

    await Mail.sendMail({
      to: `${nameDeliveryman} <${email}>`,
      subject: 'Produto disponível para entrega',
      template: 'order',
      context: {
        deliveryman: nameDeliveryman,
        product,
        recipient: nameRecipient,
        street,
        number,
        complement,
        state,
        city,
        zipcode,
      },
    });

    return res.json({
      recipient_id,
      deliveryman_id,
      product,
    });
  }

  async update(req, res) {
    const { start_date } = req.body;
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(400).json({ error: 'Order not found.' });
    }

    if (start_date) {
      const hourStart = getHours(parseISO(start_date));

      if (hourStart < 8 || hourStart > 18) {
        return res.status(400).json({ error: 'Start time not allowed.' });
      }
    }

    const {
      recipient_id,
      deliveryman_id,
      signature_id,
      product,
      canceled_at,
      end_date,
    } = await order.update(req.body);

    return res.json({
      recipient_id,
      deliveryman_id,
      signature_id,
      product,
      canceled_at,
      start_date,
      end_date,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    await order.destroy();

    return res.send();
  }
}

export default new OrderController();
