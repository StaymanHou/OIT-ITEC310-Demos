class SessionController < ApplicationController
  def index
    
  end

  def set
    session[:random_data] = ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Black'].sample
    session[:last_visit] = Time.now.to_i
  end
end
