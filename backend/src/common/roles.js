const roles = {
  USER: 'USER',
  CREATOR: 'CREATOR',
  ADMIN: 'ADMIN',
};

const roleRights = new Map([
  [roles.USER, ['getUsers', 'manageUser']],
  [roles.CREATOR, ['getUsers', 'manageUser', 'manageContent']],
  [roles.ADMIN, ['getUsers', 'manageUser', 'manageContent', 'manageSystem']],
]);

module.exports = {
  roles,
  roleRights,
};
