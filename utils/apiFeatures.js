/**
 * Classe utilitaire pour les fonctionnalités API avancées
 * - Filtrage par champs
 * - Recherche par mots-clés
 * - Pagination
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filtrage des champs (exclut les champs spéciaux)
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    this.query = this.query.find(queryObj);
    return this;
  }

  /**
   * Recherche par mot-clé sur le champ "name" et "description"
   */
  search(fields = ['name']) {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      const searchConditions = fields.map((field) => ({
        [field]: searchRegex,
      }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  /**
   * Pagination : ?page=2&limit=10
   */
  paginate(defaultLimit = 10) {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || defaultLimit;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;

    return this;
  }
}

module.exports = APIFeatures;
