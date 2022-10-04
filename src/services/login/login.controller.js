const User = require('./user.model');
const bcrypt = require('bcrypt');
const { successfulRes, failedRes } = require('../../utils/response');
const { NODE_ENV } = require('../../config/env');

exports.regUser = async (req, res) => {
  try {
    let { name, email, password, phone } = req.body;

    const prev = await User.findOne({ email }).exec();
    if (prev) return failedRes(res, 400, new Error('You already have an account'));

    if (!(email && password)) {
      return failedRes(res, 400, new Error('Email and password are REQUIRED'));
    }
    password = bcrypt.hashSync(password, 10);

    const saved = new User({ name, email, password, phone });
    await saved.save();

    const token = saved.generateToken();
    saved.password = undefined;
    req.session.user = saved.toObject();

    return successfulRes(res, 201, {
      id: saved._id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      token,
    });
  } catch (err) {
    return failedRes(res, 500, err);
  }
};

exports.logUser = async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return failedRes(res, 400, new Error('Email and password are REQUIRED'));
  }

  try {
    const logged = await User.findOne({ email }).exec();
    if (!logged) {
      return failedRes(res, 400, new Error('You do NOT have account please sign up and try again'));
    }

    const matched = bcrypt.compareSync(password, logged.password);

    if (!matched) {
      return failedRes(res, 400, new Error('Email or Password is invalid'));
    }

    const token = logged.generateToken();
    logged.password = undefined;
    req.session.user = logged.toObject();

    return successfulRes(res, 200, {
      id: logged._id,
      name: logged.name,
      email: logged.email,
      phone: logged.phone,
      token,
    });
  } catch (err) {
    return failedRes(res, 500, err);
  }
};

exports.logout = async (req, res) => {
  try {
    req.session.destroy(() => {});

    res.cookie('s_id', '', {
      sameSite: NODE_ENV === 'dev' ? false : 'none',
      secure: !(NODE_ENV === 'dev'),
    });

    return successfulRes(res, 200, 'You have been logged out successfully');
  } catch (err) {
    return failedRes(res, 500, err);
  }
};

exports.resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user._id;
  try {
    const user = await User.findById(userId).exec();
    if (!user) {
      return failedRes(res, 400, new Error('User not found'));
    }

    const matched = bcrypt.compareSync(currentPassword, user.password);
    if (!matched) {
      return failedRes(res, 400, new Error('Current password is invalid'));
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    return successfulRes(res, 200, 'Password has been changed successfully');
  } catch (err) {
    return failedRes(res, 500, err);
  }
};
